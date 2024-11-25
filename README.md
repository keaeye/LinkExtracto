# LinkExtracto
LinkExtracto 是一个简单高效的工具，用于提取 Base64 编码内容中的 VLESS 链接，并进一步提取为IP:端口#国家的形式以纯文本输出。通过 Cloudflare Pages 部署，支持动态修改数据源 URL，方便快捷。

## 功能特色
- 从 Base64 编码内容中提取 VLESS 链接。
- 格式化为 `IP:PORT#COUNTRY_CODE` 形式的纯文本输出。
- 支持通过环境变量动态配置数据源 URL，无需更改代码即可更新内容。

---

### 2. 部署到 Cloudflare Pages
1. **登录 Cloudflare**  
   登录到 Cloudflare 管理控制台，进入 **Pages**。
   
2. **创建新项目**  
   点击 **Create a project** 按钮，选择 **Connect to Git**。
   
3. **选择仓库**  
   选择您 Fork 的仓库（如 `linkextracto`），并点击 **Begin setup**。

4. **配置构建设置**  
   - **Framework preset**: 选择 **None**。
   - **Build command**: 留空。
   - **Output directory**: 留空。
   - 启用 `Worker` 功能（即使用 `_worker.js` 处理请求）。

5. **配置环境变量**  
   在 **Environment variables** 部分，点击 **Add variable**：
   - **变量名称（Name）**: URL
   - **变量值（Value）**: 输入您的数据源链接，例如 `https://example.com/data/base64.txt`。

6. **完成部署**  
   点击 **Save and Deploy** 按钮。Cloudflare Pages 会自动拉取代码并完成部署。

### 3. 修改数据源 URL
要修改数据源 URL，可以通过以下步骤完成，无需修改代码：
1. **进入 Cloudflare Pages 项目设置**  
   登录到 Cloudflare，选择 **Pages** 项目。

2. **配置环境变量**  
   点击 **设置** > **Environment variables**，找到变量名URL，值为你需要读取的网址。

3. **更新变量值**  
   点击变量后面的 **编辑** 按钮，将新的数据源 URL 输入到 **Value** 字段中，并点击 **保存**。

4. **重新部署**  
   回到 **Deployments** 页面，点击 **Trigger Deploy** 按钮以触发新部署。完成后，页面将使用新的数据源 URL。

---
### 访问和使用
部署完成后，访问 Cloudflare Pages 分配的 URL或使用自定义域名，页面会以纯文本形式显示提取的内容。
如有任何问题，请在 GitHub Issues 提交问题反馈！
