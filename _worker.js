function extractLinks(decodedContent) {
    // 正则表达式捕获 # 后的国家部分
    const regex = /vless:\/\/([a-zA-Z0-9\-]+)@([^:]+):(\d+)\?([^#]+)#(.+)/g;
    const links = [];
    let match;

    // 国家中文到英文的映射
    const countryMap = {
        '美国': 'US',
        '日本': 'JP',
        '新加坡': 'SG',
        '中国': 'CN',
        '德国': 'DE',
        '英国': 'GB',
        '法国': 'FR',
        '意大利': 'IT',
        '韩国': 'KR',
        '加拿大': 'CA',
        '澳大利亚': 'AU',
        '印度': 'IN',
        '俄罗斯': 'RU',
        '巴西': 'BR',
        '阿根廷': 'AR',
        '墨西哥': 'MX',
        '南非': 'ZA',
        '西班牙': 'ES',
        '荷兰': 'NL',
        '瑞士': 'CH',
        '瑞典': 'SE',
        '挪威': 'NO',
        '芬兰': 'FI',
        '丹麦': 'DK',
        '比利时': 'BE',
        '葡萄牙': 'PT',
        '奥地利': 'AT',
        '波兰': 'PL',
        '希腊': 'GR',
        '捷克': 'CZ',
        '匈牙利': 'HU',
        '罗马尼亚': 'RO',
        '乌克兰': 'UA',
        '土耳其': 'TR',
        '以色列': 'IL',
        '沙特阿拉伯': 'SA',
        '阿联酋': 'AE',
        '卡塔尔': 'QA',
        '科威特': 'KW',
        '巴基斯坦': 'PK',
        '孟加拉国': 'BD',
        '越南': 'VN',
        '泰国': 'TH',
        '马来西亚': 'MY',
        '菲律宾': 'PH',
        '印度尼西亚': 'ID',
        '新西兰': 'NZ',
        '冰岛': 'IS',
        '爱尔兰': 'IE',
        '智利': 'CL',
        '秘鲁': 'PE',
        '哥伦比亚': 'CO',
        '委内瑞拉': 'VE',
        '津巴布韦': 'ZW',
        '肯尼亚': 'KE',
        '尼日利亚': 'NG',
        '加纳': 'GH',
        '坦桑尼亚': 'TZ',
        '埃及': 'EG',
        '摩洛哥': 'MA',
        '阿尔及利亚': 'DZ',
        '安哥拉': 'AO',
        '乌干达': 'UG',
        '刚果（金）': 'CD',
        '塞内加尔': 'SN',
        '卢旺达': 'RW',
        '贝尔哈': 'BH',
        '巴勒斯坦': 'PS',
        '黎巴嫩': 'LB',
        '阿曼': 'OM',
        '斯里兰卡': 'LK',
        '马尔代夫': 'MV',
        '尼泊尔': 'NP',
        '柬埔寨': 'KH',
        '老挝': 'LA',
        '缅甸': 'MM'
    };

    while ((match = regex.exec(decodedContent)) !== null) {
        const ip = match[2];
        const port = match[3];
        let country = match[5]; // 捕获 # 后的国家部分

        // 如果国家部分是中文，转换为英文
        if (countryMap[country]) {
            country = countryMap[country];
        }

        const formattedLink = `${ip}:${port}#${country}`;
        links.push(formattedLink);
    }

    // 删除 #PL 的 IP
    const filteredLinks = links.filter(link => !link.includes('#PL'));

    // 随机删除每个国家一半的 IP
    const countryLinksMap = {};

    filteredLinks.forEach(link => {
        const country = link.split('#')[1];
        if (!countryLinksMap[country]) {
            countryLinksMap[country] = [];
        }
        countryLinksMap[country].push(link);
    });

    const finalLinks = [];
    Object.keys(countryLinksMap).forEach(country => {
        const countryLinks = countryLinksMap[country];
        const randomSelection = randomSelectHalf(countryLinks);
        finalLinks.push(...randomSelection);
    });

    // 去重，确保没有重复的 IP
    const uniqueLinks = [...new Set(finalLinks)];

    // 按照国家代码排序
    uniqueLinks.sort((a, b) => {
        const countryA = a.split('#')[1];
        const countryB = b.split('#')[1];
        return countryA.localeCompare(countryB);
    });

    // 将第一行的国家代码替换为 "Keaeye提供"
    if (uniqueLinks.length > 0) {
        const firstLink = uniqueLinks[0];
        const firstLinkParts = firstLink.split('#');
        const modifiedFirstLink = `${firstLinkParts[0]}#Keaeye提供`;
        uniqueLinks[0] = modifiedFirstLink;
    }

    return uniqueLinks;
}

// 随机选择一半的 IP
function randomSelectHalf(arr) {
    const shuffled = arr.sort(() => 0.5 - Math.random());
    const halfIndex = Math.floor(shuffled.length / 2);
    return shuffled.slice(0, halfIndex);
}
