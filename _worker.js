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
    let match;

    while ((match = regex.exec(decodedContent)) !== null) {
        const ip = match[2];
        const port = match[3];
        let countryCode = match[5];  // 获取国家代码

        // 移除国家代码后的所有内容（包括表情、特殊字符等）
        countryCode = countryCode.replace(/[^a-zA-Z0-9]/g, '');

        // 格式化链接，只有有效的国家代码部分
        const formattedLink = `${ip}:${port}#${countryCode}`;
        links.push(formattedLink);
    }

    // 过滤无效的链接，确保是有效的 IP 地址格式
    return links.filter(link => /^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/.test(link.split('#')[0]));
}
