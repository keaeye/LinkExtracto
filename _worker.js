export default {
    async fetch(request, env) {
        const urls = (env.URL || "").split("\n").map(url => url.trim()).filter(url => url !== "");

        if (urls.length === 0) {
            return new Response(
                "You have not set any URLs. Please provide URLs to fetch data.\n",
                { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
            );
        }

        const linkEnv = (env.LINK || "").split("\n").map(link => link.trim()).filter(link => link !== "");

        const url = new URL(request.url);
        const isUnfiltered = url.pathname.endsWith("/KY");

        let allLinks;
        try {
            allLinks = await Promise.all(urls.map(url => fetchLinks(url)));
        } catch (err) {
            console.error("Error fetching links:", err);
            return new Response("Failed to fetch links from provided URLs.", { status: 500 });
        }

        const validLinks = allLinks.flat().filter(link => link);

        if (validLinks.length === 0) {
            return new Response("No valid links found.\n", { status: 500 });
        }

        let allFinalLinks = [...validLinks, ...linkEnv];

        const uniqueLinks = Array.from(new Set(allFinalLinks));

        const updatedLinks = await updateCountryCodes(uniqueLinks, env);

        let selectedLinks;
        if (isUnfiltered) {
            selectedLinks = sortLinksByCountry(updatedLinks);
        } else {
            selectedLinks = selectRandomFiveByCountry(updatedLinks);
        }

        if (selectedLinks.length > 0) {
            selectedLinks[0] = selectedLinks[0].replace(/#\w+$/, "#Keaeye提供");
        }

        const plainTextContent = selectedLinks.join('\n');
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
        const countryCode = match[5].replace(/[^A-Za-z]/g, '');
        const formattedLink = `${ip}:${port}#${countryCode}`;
        links.push(formattedLink);
    }
    return links;
}

async function updateCountryCodes(links, env) {
    const apiKey = env.IP_API_KEY;
    const apiEndpoint = 'https://pro.ip-api.com/json/';

    return await Promise.all(links.map(async (link) => {
        const [ipWithPort, country] = link.split('#');
        if (country) {
            return link;
        }
        const ip = ipWithPort.split(':')[0];
        try {
            const response = await fetch(`${apiEndpoint}${ip}?key=${apiKey}`);
            const json = await response.json();
            if (json.status === 'success') {
                return `${ipWithPort}#${json.countryCode}`;
            }
        } catch (error) {
            console.error(`Failed to fetch country code for IP: ${ip}`, error);
        }
        return link;
    }));
}

function sortLinksByCountry(links) {
    const countryOrder = [
        "US", "KR", "TW", "JP", "SG", "HK", "CA", "AU", "GB", "FR", "IT", "NL", "DE", "NO", "FI", "SE", "DK", "LT", "RU", "IN", "TR"
    ];

    return links.sort((a, b) => {
        const countryIndexA = countryOrder.indexOf(a.split("#")[1]);
        const countryIndexB = countryOrder.indexOf(b.split("#")[1]);

        if (countryIndexA === -1) return 1;
        if (countryIndexB === -1) return -1;

        return countryIndexA - countryIndexB;
    });
}

function selectRandomFiveByCountry(links) {
    const countryOrder = [
        "US", "KR", "JP", "SG", "HK", "CA", "AU", "GB", "TW", "FR", "IT", "NL", "DE", "NO", "FI", "SE", "DK", "LT", "RU", "IN", "TR"
    ];

    const excludeCountries = ["TR", "RU", "LT", "DK", "SE", "FI", "NO", "DE", "NL", "IT", "FR", "AU", "CA", "PL"];

    const groupedLinks = {};
    links.forEach(link => {
        const countryCode = link.split("#")[1];
        if (!excludeCountries.includes(countryCode)) {
            if (!groupedLinks[countryCode]) {
                groupedLinks[countryCode] = [];
            }
            groupedLinks[countryCode].push(link);
        }
    });

    const result = [];
    countryOrder.forEach(country => {
        if (groupedLinks[country]) {
            const linksForCountry = groupedLinks[country];
            const uniqueLinks = Array.from(new Set(linksForCountry));
            const selectedLinks = shuffleArray(uniqueLinks).slice(0, 5);
            selectedLinks.forEach(link => {
                if (!result.includes(link)) {
                    result.push(link);
                }
            });
        }
    });

    return result;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
