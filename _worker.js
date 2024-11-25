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
            const base64Data = await fetch(url).then(res => res.text()).catch(err => {
                console.error(`Failed to fetch from ${url}:`, err);
                return null;
            });

            if (!base64Data) {
                continue;
            }

            let decodedContent;
            try {
                decodedContent = atob(base64Data);
            } catch (e) {
                console.error("Failed to decode the content:", e);
                continue;
            }

            // Step 2: Decode URL-encoded parts (e.g., %E6%B5%8B%E8%AF%95)
            decodedContent = decodeURIComponent(decodedContent);

            const links = extractLinks(decodedContent);

            if (links.length > 0) {
                allLinks = allLinks.concat(links);
            }
        }

        if (allLinks.length === 0) {
            return new Response("No valid links found", { status: 500 });
        }

        const plainTextContent = allLinks.join('\n');

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
        let countryCode = decodeURIComponent(match[5]); // Ensure the country part is URL-decoded

        // 识别国家文字部分
        countryCode = extractCountry(countryCode);

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

// 提取国家部分（包括#后面的复杂文字）
function extractCountry(countryCode) {
    const countryRegex = /#([^#]+)/;
    const match = countryCode.match(countryRegex);
    if (match) {
        let country = match[1];
        if (isChinese(country)) {
            country = translateToEnglish(country);
        }
        return country;
    }
    return countryCode; // 如果没有找到，返回原始的国家部分
}

// 判断是否为中文
function isChinese(text) {
    return /[\u4e00-\u9fa5]/.test(text);
}

// 将中文翻译为英文（假设只处理部分常见国家名）
function translateToEnglish(chinese) {
    const translations = {
        "美国": "USA",
        "新加坡": "Singapore",
        "英国": "UK",
        "中国": "China",
        "日本": "Japan",
        "印度": "India"
    };
    return translations[chinese] || chinese;
}

// 随机选择一半的 IP
function randomSelectHalf(arr) {
    const shuffled = arr.sort(() => 0.5 - Math.random());
    const half = Math.floor(shuffled.length / 2);
    return shuffled.slice(0, half);
}
