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
        let countryCode = decodeURIComponent(match[5]); // Ensure the country part is URL-decoded

        // 识别国家文字部分，中文转英文
        countryCode = convertCountryCode(countryCode, debugInfo);
        debugInfo += `Extracted country code: ${countryCode}\n`;  // 输出提取的国家代码

        const formattedLink = `${ip}:${port}#${countryCode}`;
        links.push(formattedLink);
    }

    debugInfo += `Extracted Links: ${links}\n`;  // 输出提取的所有链接

    // 按照国家代码排序
    links.sort((a, b) => {
        const countryA = a.split('#')[1];
        const countryB = b.split('#')[1];
        return countryA.localeCompare(countryB);
    });

    // 删除 #PL 的 IP
    const filteredLinks = links.filter(link => !link.includes('#PL'));
    debugInfo += `Filtered Links (excluding #PL): ${filteredLinks}\n`;

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

    debugInfo += `Final Processed Links: ${finalLinks}\n`;  // 输出最终处理后的链接

    return finalLinks;
}

// 转换中文国家名称为英文国家代码
function convertCountryCode(countryCode, debugInfo) {
    const chineseToEnglish = {
        "美国": "USA",
        "新加坡": "Singapore",
        "英国": "UK",
        "中国": "China",
        "日本": "Japan",
        "印度": "India",
        "立陶宛": "Lithuania",
        "俄罗斯": "Russia",
        "土耳其": "Turkey"
    };

    // 如果是中文国家名称，转换为英文
    if (isChinese(countryCode)) {
        debugInfo += `Chinese country name detected: ${countryCode}\n`;
        return chineseToEnglish[countryCode] || countryCode;  // 默认返回原始中文
    }

    // 如果已经是英文国家代码，直接返回
    return countryCode;
}

// 判断是否为中文
function isChinese(text) {
    return /[\u4e00-\u9fa5]/.test(text);
}

// 随机选择一半的 IP
function randomSelectHalf(arr) {
    const shuffled = arr.sort(() => 0.5 - Math.random());
    const half = Math.floor(shuffled.length / 2);
    return shuffled.slice(0, half);
}
