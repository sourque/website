+++
title = "PlanePivotHinge"
date = 2020-10-03
category = "web"

+++

> There are many types of joints in the human body. The benevolent author of some old code gave it a facelift to include the latest web tech. Now this app has all the joint types. 
> Site: pivotplanehinge.ctf.cuctf.io:8079

We're given a tastefully designed website that allows us to use WebSockets to send a string to the `/echo` endpoint on the web server.

![image-20201007013627896](../image-20201007013627896.png)

The catch is that, when the text contains `cat flag.txt`, the web server returns an error, saying something about an `Origin` being not permitted or defined.

Also, when connecting, the page displays the following data:

![image-20201007013847543](../image-20201007013847543.png)

The `connectedHosts` item at the bottom, with `admin` seemingly connecting from Google's DNS server, made me think that we could just manipulate the edit the Origin and the jank Go code on the other side would give us the flag after checking the `Origin`.

Unfortunately, that didn't work. However, when changing both the `Origin` and the `Host` field, we got our flag :)

![image-20201007014043543](../image-20201007014043543.png)
