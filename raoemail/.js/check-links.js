const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');

// 要检查的网站根目录
const ROOT_DIR = path.join(__dirname, 'raoemail');
// 要检查的HTML文件扩展名
const HTML_EXTENSIONS = ['.html', '.htm'];
// 已检查的链接
const checkedLinks = new Set();
// 错误链接
const brokenLinks = [];

// 读取HTML文件并提取所有链接
function extractLinksFromFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const dom = new JSDOM(content);
    const links = dom.window.document.querySelectorAll('a[href]');
    const extractedLinks = [];

    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
            extractedLinks.push(href);
        }
    });

    return extractedLinks;
}

// 递归遍历目录，查找HTML文件
function findHtmlFiles(dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    entries.forEach(entry => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...findHtmlFiles(fullPath));
        } else if (HTML_EXTENSIONS.includes(path.extname(entry.name))) {
            files.push(fullPath);
        }
    });

    return files;
}

// 检查链接有效性
async function checkLink(link) {
    if (checkedLinks.has(link)) {
        return;
    }

    checkedLinks.add(link);

    try {
        const response = await fetch(link, { method: 'HEAD', timeout: 10000 });
        if (!response.ok) {
            brokenLinks.push({ link, status: response.status, message: response.statusText });
        }
    } catch (error) {
        brokenLinks.push({ link, error: error.message });
    }
}

// 主函数
async function main() {
    console.log('开始检查网站链接...');
    
    // 查找所有HTML文件
    const htmlFiles = findHtmlFiles(ROOT_DIR);
    console.log(`找到 ${htmlFiles.length} 个HTML文件`);

    // 提取所有链接
    const allLinks = [];
    htmlFiles.forEach(file => {
        const links = extractLinksFromFile(file);
        allLinks.push(...links);
    });

    console.log(`提取到 ${allLinks.length} 个链接`);

    // 检查每个链接
    for (const link of allLinks) {
        await checkLink(link);
    }

    // 输出结果
    console.log('\n===== 链接检查结果 =====');
    if (brokenLinks.length === 0) {
        console.log('所有链接都正常！');
    } else {
        console.log(`发现 ${brokenLinks.length} 个错误链接：`);
        brokenLinks.forEach((item, index) => {
            console.log(`${index + 1}. ${item.link}`);
            if (item.status) {
                console.log(`   状态码：${item.status} - ${item.message}`);
            } else if (item.error) {
                console.log(`   错误：${item.error}`);
            }
        });
    }

    // 生成报告
    const report = {
        timestamp: new Date().toISOString(),
        totalLinks: allLinks.length,
        brokenLinks: brokenLinks.length,
        brokenLinksDetails: brokenLinks
    };

    fs.writeFileSync('link-check-report.json', JSON.stringify(report, null, 2));
    console.log('\n报告已生成：link-check-report.json');
}

// 运行主函数
main().catch(console.error);
