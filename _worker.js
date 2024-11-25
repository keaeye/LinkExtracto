export default {
    async fetch(请求, env) {
        // 获取环境变量 URL
        const url = env.URL;

        if (!url) {
            // 如果 URL 未设置，返回提示信息
            return new Response(
                "You have not set the URL. 请填写 URL 以便提取数据。",
                {
                    headers: { 'Content-Type': 'text/plain; charset=utf-8' } // 设置UTF-8编码
                }
            );
        }

        // 获取 base64 编码内容
        const base64Data = await fetch(url).then(res => res.text()).catch(err => {
            console.error("Failed to fetch the content:", err);
            return null;
        });

        if (!base64Data) {
            return new Response("Failed to fetch the data", { status: 500 });
        }

        // 解码 base64 内容
        let decodedContent;
        try {
            decodedContent = atob(base64Data);
        } catch (e) {
            console.error("Failed to decode the content:", e);
            return new Response("Failed to decode the content", { status: 500 });
        }

        // 提取需要的信息并格式化
        const links = extractLinks(decodedContent);

        if (links.length === 0) {
            return new Response("No valid links found", { status: 500 });
        }

        // 将格式化后的结果返回给客户端，以纯文本形式显示
        const plainTextContent = links.join('\n');

        return new Response(plainTextContent, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' } // 确保返回 UTF-8 编码
        });
    }
};

// 提取 base64 解码内容中的 vless 链接，并格式化为 IP:PORT#COUNTRY_CODE
function extractLinks(decodedContent) {
    const regex = /vless:\/\/([a-zA-Z0-9\-]+)@([^:]+):(\d+)\?([^#]+)#([^%]+)%F0%9F%90%B2/g;
    const links = [];
    let match;

    // 遍历所有匹配的 vless 链接
    while ((match = regex.exec(decodedContent)) !== null) {
        const ip = match[2];  // 提取 IP 地址
        const port = match[3]; // 提取端口号
        let countryCode = decodeURIComponent(match[5]); // 提取国家代码，并解码

        // 格式化链接
        const formattedLink = `${ip}:${port}#${countryCode}`;
        links.push(formattedLink);
    }

    // 按照国家代码排序
    links.sort((a, b) => {
        const countryA = a.split('#')[1]; // 提取第一个链接的国家代码
        const countryB = b.split('#')[1]; // 提取第二个链接的国家代码
        return countryA.localeCompare(countryB); // 按字母顺序排序
    });

    // 将排序后的链接中的首行国家代码改为 "Keaeye提供"
    if (links.length > 0) {
        const firstLink = links[0]; // 获取排在最前面的链接
        const firstLinkParts = firstLink.split('#');  // 分割出国家代码
        const modifiedFirstLink = `${firstLinkParts[0]}#Keaeye提供`;  // 替换为 "Keaeye提供"
        links[0] = modifiedFirstLink;  // 更新排在最前面的链接
    }

    // 删除所有 #PL 的 IP
    const filteredLinks = links.filter(link => !link.includes('#PL'));

    // 将每个国家的 IP 随机删除一半
    const countryMap = {};

    // 将过滤后的链接按国家分组
    filteredLinks.forEach(link => {
        const country = link.split('#')[1];
        if (!countryMap[country]) {
            countryMap[country] = [];
        }
        countryMap[country].push(link);
    });

    // 对每个国家的 IP 随机删除一半
    const finalLinks = [];
    Object.keys(countryMap).forEach(country => {
        const countryLinks = countryMap[country];
        const randomSelection = randomSelectHalf(countryLinks);
        finalLinks.push(...randomSelection);
    });

    return finalLinks;
}

// 随机选择一半的 IP
function randomSelectHalf(arr) {
    const shuffled = arr.sort(() => 0.5 - Math.random()); // 打乱顺序
    const half = Math.floor(shuffled.length / 2); // 计算一半的数量
    return shuffled.slice(0, half); // 返回前一半
}
