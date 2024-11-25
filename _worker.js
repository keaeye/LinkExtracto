export default {
    async fetch(请求, env) {
        // 获取环境变量 URL
        const url = env.网站;

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
            headers: { 'Content-Type': 'text/plain' }
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
        const countryCode = decodeURIComponent(match[5]); // 提取国家代码，并解码

        // 格式化输出：IP:PORT#COUNTRY_CODE
        const formattedLink = `${ip}:${port}#${countryCode}`;
        links.push(formattedLink);
    }

    return links;
}
