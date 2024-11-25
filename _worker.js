export default {
    async fetch(请求, env) {
        let debugInfo = "";  // 用于保存调试信息
        debugInfo += "Fetching URLs...\n";

        const urls = (env.URL || "").split("\n").map(url => url.trim()).filter(url => url !== "");

        if (urls.length === 0) {
            debugInfo += "No URLs provided.\n";
            return new Response(
                "You have not set any URLs. Please provide URLs to fetch data.\n" + debugInfo,
                {
                    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                }
            );
        }

        let allLinks = [];
        for (const url of urls) {
            debugInfo += `Fetching URL: ${url}\n`;  // 输出正在处理的 URL
            const base64Data = await fetch(url).then(res => res.text()).catch(err => {
                console.error(`Failed to fetch from ${url}:`, err);
                debugInfo += `Failed to fetch from ${url}: ${err}\n`;
                return null;
            });

            if (!base64Data) {
                continue;
            }

            debugInfo += `Base64 Data: ${base64Data}\n`;  // 输出获取的 base64 数据

            let decodedContent;
            try {
                decodedContent = atob(base64Data);
                debugInfo += `Decoded Content: ${decodedContent}\n`;  // 输出 base64 解码后的内容
            } catch (e) {
                console.error("Failed to decode the content:", e);
                debugInfo += `Failed to decode the content: ${e}\n`;
                continue;
            }

            // Step 2: Decode URL-encoded parts (e.g., %E6%B5%8B%E8%AF%95)
            decodedContent = decodeURIComponent(decodedContent);
            debugInfo += `Decoded Content (URL-decoded): ${decodedContent}\n`;  // 输出 URL 解码后的内容

            const links = extractLinks(decodedContent, debugInfo);

            if (links.length > 0) {
                allLinks = allLinks.concat(links);
                debugInfo += `Found Links: ${links}\n`;  // 输出找到的链接
            }
        }

        if (allLinks.length === 0) {
            debugInfo += "No valid links found.\n";
            return new Response("No valid links found.\n" + debugInfo, { status: 500 });
        }

        const plainTextContent = allLinks.join('\n');
        debugInfo += `Final Links: ${plainTextContent}\n`;  // 输出最终的链接内容

        return new Response(plainTextContent + "\n" + debugInfo, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }
};

function extractLinks(decodedContent, debugInfo) {
    const regex = /vless:\/\/([a-zA-Z0-9\-]+)@([^:]+):(\d+)\?([^#]+)#([^\n]+)/g;
    const links = [];
    let match;

    debugInfo += "Extracting links from decoded content...\n";

    while ((match = regex.exec(decodedContent)) !== null) {
        debugInfo += `Match found: ${match}\n`;  // 输出每次正则匹配的结果
        const ip = match[2];
        const port = match[3];
        const countryCode = match[5];  // 保持原始国家代码，不进行转换

        const formattedLink = `${ip}:${port}#${countryCode}`;
        links.push(formattedLink);
    }

    debugInfo += `Extracted Links: ${links}\n`;  // 输出提取的所有链接

    // 返回提取的链接
    return links;
}
