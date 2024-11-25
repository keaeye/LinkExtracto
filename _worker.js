export default {
    async fetch(请求, env) {
        const urls = (env.URL || "").split("\n").map(url => url.trim()).filter(url => url !== "");

        if (urls.length === 0) {
            return new Response(
                "You have not set any URLs. Please provide URLs to fetch data.",
                {
                    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                }
            );
        }

        let allLinks = [];
        for (const url of urls) {
            console.log(`Fetching URL: ${url}`);  // 输出正在处理的 URL
            const base64Data = await fetch(url).then(res => res.text()).catch(err => {
                console.error(`Failed to fetch from ${url}:`, err);
                return null;
            });

            if (!base64Data) {
                continue;
            }

            console.log(`Base64 Data: ${base64Data}`);  // 输出获取的 base64 数据

            let decodedContent;
            try {
                decodedContent = atob(base64Data);
                console.log(`Decoded Content: ${decodedContent}`);  // 输出 base64 解码后的内容
            } catch (e) {
                console.error("Failed to decode the content:", e);
                continue;
            }

            // Step 2: Decode URL-encoded parts (e.g., %E6%B5%8B%E8%AF%95)
            decodedContent = decodeURIComponent(decodedContent);
            console.log(`Decoded Content (URL-decoded): ${decodedContent}`);  // 输出 URL 解码后的内容

            const links = extractLinks(decodedContent);

            if (links.length > 0) {
                allLinks = allLinks.concat(links);
                console.log(`Found Links: ${links}`);  // 输出找到的链接
            }
        }

        if (allLinks.length === 0) {
            return new Response("No valid links found", { status: 500 });
        }

        const plainTextContent = allLinks.join('\n');
        console.log(`Final Links: ${plainTextContent}`);  // 输出最终的链接内容

        return new Response(plainTextContent, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }
};

function extractLinks(decodedContent) {
    const regex = /vless:\/\/([a-zA-Z0-9\-]+)@([^:]+):(\d+)\?([^#]+)#([^%]+)%F0%9F%90%B2/g;
    const links = [];
    let match;

    console.log("Extracting links from decoded content...");

    while ((match = regex.exec(decodedContent)) !== null) {
        console.log(`Match found: ${match}`);  // 输出每次正则匹配的结果
        const ip = match[2];
        const port = match[3];
        let countryCode = decodeURIComponent(match[5]); // Ensure the country part is URL-decoded

        // 识别国家文字部分
        countryCode = extractCountry(countryCode);
        console.log(`Extracted country code: ${countryCode}`);  // 输出提取的国家代码

        const formattedLink = `${ip}:${port}#${countryCode}`;
        links.push(formattedLink);
    }

    console.log(`Extracted Links: ${links}`);  // 输出提取的所有链接

    // 按照国家代码排序
    links.sort((a, b) => {
        const countryA = a.split('#')[1];
        const countryB = b.split('#')[1];
        return countryA.localeCompare(countryB);
    });

    // 删除 #PL 的 IP
    const filteredLinks = links.filter(link => !link.includes('#PL'));
    console.log(`Filtered Links (excluding #PL): ${filteredLinks}`);

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

    console.log(`Final Processed Links: ${finalLinks}`);  // 输出最终处理后的链接

    return finalLinks;
}

// 提取国家部分（包括#后面的复杂文字）
function extractCountry(countryCode) {
    // 中文到英文的国家名映射
    const chineseCountries = {
        "美国": "USA",
        "新加坡": "Singapore",
        "英国": "UK",
        "中国": "China",
        "日本": "Japan",
        "印度": "India"
    };

    // 如果是中文国家名，则转换为英文
    if (isChinese(countryCode)) {
        console.log(`Country code is Chinese: ${countryCode}`);  // 输出中文国家代码
        return chineseCountries[countryCode] || countryCode;  // 默认返回原始中文
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
