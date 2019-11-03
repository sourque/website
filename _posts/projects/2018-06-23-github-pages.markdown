---
title: "GitHub Pages as a Cheap Hosting Solution"
date: 2018-06-23
layout: post
software: true
published: true
---

I realize it isn't a novel idea (and it's even somewhat extensively advertised by GitHub/GitLab) to host a blog/website with Git{Hub, Lab} Pages, but I think it's often overlooked by those who are not familiar with GitHub, and not-for-profit organizations who may be paying $300 dollars for two years of hosting their static website that gets ten viewers a day on BlueHost or something, with a grossly over-engineering and over-complicated control panel, features, and an intentionally complex cancelling process. This is how it was with an organization at my high school, so I helped make the marked improvement of 150 dollars to 12 dollars a year.

But regardless of that, this is my website that I manage, a project of mine,using a modified version of Sergio Kopplin's [Indigo](https://github.com/sergiokopplin/indigo) theme, and with no JavaScript or Google Analytics. The repository can be viewed at [this](https://github.com/543hn/543hn-website) location.

As part of my 'modifications,' I've been deleting as much as possible, in terms of features, files, and lines of html/sass/etc that I don't use, which has led to 99/100 on Google's [PageSpeed Insights](https://developers.google.com/speed/pagespeed/insights/?url=543hn.com&tab=mobile) for mobile, compared to Sergio's 84/100 for mobile, and a less impressive 2 point improvement on desktop over Sergio's original repository. 


![GM Screenshot]({{ site.url }}/assets/images/pagespeedmobile.png)


However, Kopplin's repo supports more features (obviously) and he's a talented developer and designer, so no disrespect intended.

Still working on my `notes.543hn.com` domain, with files coming from a separate repository, which just consists of rendered Markdown files.
