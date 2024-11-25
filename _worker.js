export default {
    async fetch(请求, env) {
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

const countryMapping = {
    'HK': 'Hong Kong',
    'KR': 'South Korea',
    'TW': 'Taiwan',
    'JP': 'Japan',
    'US': 'United States',
    // 可以继续添加更多映射...
};

async function fetchLinks(url) {
    let base64Data;
    try {
        base64Data = await fetch(url).then(res => res.text());
    } catch (err) {
        console.error(`Failed to fetch from ${url}:`, err);
        return null;
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
        let countryCode = match[5];

        countryCode = optimizeCountryCode(countryCode);

        if (countryCode) {
            const formattedLink = `${ip}:${port}#${countryCode}`;
            links.push(formattedLink);
        }
    }

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
