export default {
    async fetch(request, env) {
        const urls = (env.URL || "").split("\n").map(url => url.trim()).filter(url => url !== "");

        if (urls.length === 0) {
            return new Response(
                "You have not set any URLs. Please provide URLs to fetch data.\n",
                { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
            );
        }

        const allLinks = await Promise.all(urls.map(url => fetchLinks(url)));

        const validLinks = allLinks.flat().filter(link => link);

        if (validLinks.length === 0) {
            return new Response("No valid links found.\n", { status: 500 });
        }

        const plainTextContent = validLinks.join('\n');
        return new Response(plainTextContent + "\n", {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }
};

async function fetchLinks(url) {
    let base64Data;
    try {
        base64Data = await fetch(url).then(res => res.text());
    } catch (err) {
        console.error(`Failed to fetch from ${url}:`, err);
        return [];
    }

    if (!base64Data) {
        return [];
    }

    let decodedContent;
    try {
        decodedContent = atob(base64Data);
    } catch (e) {
        console.error("Failed to decode the content:", e);
        return [];
    }

    decodedContent = decodeURIComponent(decodedContent);
    return extractLinks(decodedContent);
}

function extractLinks(decodedContent) {
    const regex = /vless:\/\/([a-zA-Z0-9\-]+)@([^:]+):(\d+)\?([^#]+)#([^\n]+)/g;
    const links = [];
    const countryMapping = {
        "香港": "香港",
        "韩国": "韩国",
        "台湾": "台湾",
        "日本": "日本",
        "新加坡": "新加坡",
        "美国": "美国",
        "加拿大": "加拿大",
        "澳大利亚": "澳大利亚",
        "英国": "英国",
        "法国": "法国",
        "意大利": "意大利",
        "荷兰": "荷兰",
        "德国": "德国",
        "挪威": "挪威",
        "芬兰": "芬兰",
        "瑞典": "瑞典",
        "丹麦": "丹麦",
        "立陶宛": "立陶宛",
        "俄罗斯": "俄罗斯",
        "印度": "印度",
        "土耳其": "土耳其"
    };
    
    let match;
    while ((match = regex.exec(decodedContent)) !== null) {
        const ip = match[2];
        const port = match[3];
        let countryCode = match[5];

        // 映射国家
        for (let country in countryMapping) {
            if (countryCode.includes(country)) {
                countryCode = countryMapping[country];
                break;
            }
        }

        // 获取格式化链接并加上国家代码
        const formattedLink = `${ip}:${port}#${countryCode}`;
        links.push(formattedLink);
    }

    // 过滤无效的链接，确保是有效的 IP 地址格式
    return links.filter(link => /^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/.test(link.split('#')[0]));
}
