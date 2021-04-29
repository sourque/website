+++
title = "Graphed"
date = 2020-10-03
category = "web"
+++

> I am building a blog, but I exposed the api for anyone interested in reading my posts.
Site: http://graphed.ctf.cuctf.io:6200/graphql.

I hadn't heard of **GraphQL** before, but it looked like some kind of data storage-retrieval scheme and API.

I tried using `nmap` and `gobuster` for a bit, but didn't find anything. This solidified my belief that the challenge was simply using the API in some fashion to retrieve the flag.

I found a GraphQL payload on [PayloadAllTheThings](https://github.com/swisskyrepo/PayloadsAllTheThings) that let me enumerate available types:

{{< highlight bash >}}
curl --http0.9 http://graphed.ctf.cuctf.io:6200/graphql -d "query={__schema{types{name,fields{name}}}}"
{{< /highlight >}}


Which gave:

![image-20201007010356354](../image-20201007010356354.png)

From here, since the posts for all users were not directly available (we could only read from author *pop_eax*), it was basically a sure bet that there would be a second user with the flag as a post (other than two notes exposed through `coolNotes`).

So, we begin at `allUsers` and follow the object types to get the posts from all users.

{{< highlight bash >}}
curl --http0.9 http://graphed.ctf.cuctf.io:6200/graphql -d "query={ allUsers { edges { node { notes { edges { node { title, body } } } } } } }"
{{< /highlight >}}

Returning the flag, for the blood:

![image-20201007010620262](../image-20201007010509231.png)
