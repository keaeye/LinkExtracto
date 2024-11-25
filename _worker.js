export default {
    async fetch(请求, env) {
        let debugInfo = "Fetching URLs...\n";

        const urls = (env.URL || "").split("\n").map(url => url.trim()).filter(url => url !== "");

        if (urls.length === 0) {
            debugInfo += "No URLs provided.\n";
            return new Response(
                "You have not set any URLs. Please provide URLs to fetch data.\n" + debugInfo,
                { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
            );
        }

        const allLinks = await Promise.all(urls.map(url => fetchLinks(url, debugInfo)));

        const validLinks = allLinks.flat().filter(link => link);

        if (validLinks.length === 0) {
            debugInfo += "No valid links found.\n";
            return new Response("No valid links found.\n" + debugInfo, { status: 500 });
        }

        const plainTextContent = validLinks.join('\n');
        debugInfo += `Final Links: ${plainTextContent}\n`;

        return new Response(plainTextContent + "\n" + debugInfo, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }
};

const countryMapping = {
    'HK': 'Hong Kong',
    'KR': 'South Korea',
    'TW': 'Taiwan',
    'JP': 'Japan',
    'US': 'United States',
    // 可以继续添加更多映射...
};

async function fetchLinks(url, debugInfo) {
    debugInfo += `Fetching URL: ${url}\n`;

    let base64Data;
    try {
        base64Data = await fetch(url).then(res => res.text());
    } catch (err) {
        console.error(`Failed to fetch from ${url}:`, err);
        debugInfo += `Failed to fetch from ${url}: ${err}\n`;
        return null;
    }

    if (!base64Data) {
        return [];
    }

    debugInfo += `Base64 Data: ${base64Data}\n`;

    let decodedContent;
    try {
        decodedContent = atob(base64Data);
        debugInfo += `Decoded Content: ${decodedContent}\n`;
    } catch (e) {
        console.error("Failed to decode the content:", e);
        debugInfo += `Failed to decode the content: ${e}\n`;
        return [];
    }

    decodedContent = decodeURIComponent(decodedContent);
    debugInfo += `Decoded Content (URL-decoded): ${decodedContent}\n`;

    return extractLinks(decodedContent, debugInfo);
}

function extractLinks(decodedContent, debugInfo) {
    const regex = /vless:\/\/([a-zA-Z0-9\-]+)@([^:]+):(\d+)\?([^#]+)#([^\n]+)/g;
    const links = [];
    let match;

    debugInfo += "Extracting links from decoded content...\n";

    while ((match = regex.exec(decodedContent)) !== null) {
        debugInfo += `Match found: ${match}\n`;

        const ip = match[2];
        const port = match[3];
        let countryCode = match[5];

        countryCode = optimizeCountryCode(countryCode);

        if (countryCode) {
            const formattedLink = `${ip}:${port}#${countryCode}`;
            links.push(formattedLink);
        }
    }

    debugInfo += `Extracted Links: ${links}\n`;

    return links;
}

function optimizeCountryCode(countryCode) {
    if (countryMapping[countryCode]) {
        return countryMapping[countryCode];
    }

    const countryRegex = /^[A-Za-z\s-]+$/;
    if (countryCode && countryRegex.test(countryCode)) {
        return countryCode.split(/[^\w\s-]+/)[0];
    }

    return null;
}
