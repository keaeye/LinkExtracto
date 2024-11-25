export default {
    async fetch(请求, env) {
        const urls = env.URL;  // 获取 URL 输入，可能是多行

        if (!urls) {
            return new Response(
                "You have not set the URL. 请填写 URL 以便提取数据。",
                {
                    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                }
            );
        }

        // 将多行 URL 拆分成一个数组
        const urlList = urls.split('\n').map(url => url.trim()).filter(url => url);

        if (urlList.length === 0) {
            return new Response("No valid URLs provided", { status: 400 });
        }

        let allLinks = [];

        // 对每个 URL 执行提取操作
        for (const url of urlList) {
            const base64Data = await fetch(url).then(res => res.text()).catch(err => {
                console.error("Failed to fetch the content from", url, ":", err);
                return null;
            });

            if (!base64Data) {
                continue;  // 如果获取失败，跳过当前 URL
            }

            let decodedContent;
            try {
                decodedContent = atob(base64Data);
            } catch (e) {
                console.error("Failed to decode the content from", url, ":", e);
                continue;  // 如果解码失败，跳过当前 URL
            }

            const links = extractLinks(decodedContent);
            allLinks = [...allLinks, ...links];  // 将当前 URL 提取到的链接合并到总链接中
        }

        if (allLinks.length === 0) {
            return new Response("No valid links found", { status: 500 });
        }

        const plainTextContent = allLinks.join('\n');  // 将所有链接输出为换行分隔的文本

        return new Response(plainTextContent, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }
};

function extractLinks(decodedContent) {
    const regex = /vless:\/\/([a-zA-Z0-9\-]+)@([^:]+):(\d+)\?([^#]+)#([^%]+)%F0%9F%90%B2/g;
    const links = [];
    let match;

    while ((match = regex.exec(decodedContent)) !== null) {
        const ip = match[2];
        const port = match[3];
        let countryCode = decodeURIComponent(match[5]);

        const formattedLink = `${ip}:${port}#${countryCode}`;
        links.push(formattedLink);
    }

    // 按照国家代码排序
    links.sort((a, b) => {
        const countryA = a.split('#')[1];
        const countryB = b.split('#')[1];
        return countryA.localeCompare(countryB);
    });

    // 删除 #PL 的 IP
    const filteredLinks = links.filter(link => !link.includes('#PL'));

    // 随机删除每个国家一半的 IP
    const countryMap = {};

    filteredLinks.forEach(link => {
        const country = link.split('#')[1];
        if (!countryMap[country]) {
            countryMap[country] = [];
        }
        countryMap[country].push(link);
    });

    const finalLinks = [];
    Object.keys(countryMap).forEach(country => {
        const countryLinks = countryMap[country];
        const randomSelection = randomSelectHalf(countryLinks);
        finalLinks.push(...randomSelection);
    });

    // 将第一行的国家代码替换为 "Keaeye提供"
    if (finalLinks.length > 0) {
        const firstLink = finalLinks[0];
        const firstLinkParts = firstLink.split('#');
        const modifiedFirstLink = `${firstLinkParts[0]}#Keaeye提供`;
        finalLinks[0] = modifiedFirstLink;
    }

    return finalLinks;
}

// 随机选择一半的 IP
function randomSelectHalf(arr) {
    const shuffled = arr.sort(() => 0.5 - Math.random());
    const half = Math.floor(shuffled.length / 2);
    return shuffled.slice(0, half);
}
