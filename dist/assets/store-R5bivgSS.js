import{p as i,c as p}from"./RedirectTo-B8PSjlmi.js";import{c}from"./vendor-zustand-BAHFVYhP.js";const u=[{id:"ann-1",title:"古城游览安全提醒",content:`温馨提示各位游客：
1. 游览时请注意人身财产安全
2. 妥善保管贵重物品
3. 夜间行走请选择明亮路段
4. 如遇紧急情况请联系：0888-5110110`,images:["https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=800&q=70"],type:"公告",publishTime:"2024-04-10T08:00:00Z",status:"published",createdAt:"2024-04-10T08:00:00Z",updatedAt:"2024-04-10T08:00:00Z"},{id:"ann-2",title:"古城特产对外销售备案申请通道开放",content:`为规范古城特产销售市场，保障消费者权益，现已开通线上备案申请通道。

备案范围：丽江特色产品、民族工艺品等
备案流程：线上提交资料 → 审核 → 领取备案证明

详情请咨询：0888-5123456`,images:[],type:"公告",publishTime:"2024-04-15T09:00:00Z",status:"published",createdAt:"2024-04-14T10:00:00Z",updatedAt:"2024-04-15T09:00:00Z"},{id:"ann-3",title:"古城水系清淤维护通知",content:`为保障古城水系清洁，营造良好游览环境，我局将对古城核心区水系进行清淤维护。

施工时间：4月20日至4月25日
施工范围：四方街至玉河广场段

请各位游客合理安排游览路线，施工期间给您带来的不便敬请谅解。`,images:["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=70","https://images.unsplash.com/photo-1590674899484-d5640f854c2d?auto=format&fit=crop&w=800&q=70"],type:"公告",publishTime:"2024-04-12T08:00:00Z",status:"published",createdAt:"2024-04-11T16:00:00Z",updatedAt:"2024-04-12T08:00:00Z"},{id:"ann-4",title:"五一假期旅游攻略",content:`五一假期将至，为您准备了一份详细的古城游玩攻略。

推荐路线：大水车 → 四方街 → 木府 → 狮子山 → 束河古镇

美食推荐：丽江腊排骨、纳西烤鱼、鸡豆凉粉

住宿建议：建议提前预订古城内客栈`,images:["https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=800&q=70","https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=70","https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=800&q=70"],type:"公告",publishTime:"2024-04-08T10:00:00Z",status:"published",createdAt:"2024-04-08T10:00:00Z",updatedAt:"2024-04-08T10:00:00Z"}],r=c()(i((a,s)=>({announcements:u,addAnnouncement:e=>{const t=`ann-${Date.now()}`,n=new Date().toISOString();return a(o=>({announcements:[...o.announcements,{...e,id:t,status:"draft",publishTime:"",createdAt:n,updatedAt:n}]})),t},updateAnnouncement:(e,t)=>a(n=>({announcements:n.announcements.map(o=>o.id===e?{...o,...t,updatedAt:new Date().toISOString()}:o)})),deleteAnnouncement:e=>a(t=>({announcements:t.announcements.filter(n=>n.id!==e)})),publishAnnouncement:e=>a(t=>({announcements:t.announcements.map(n=>n.id===e?{...n,status:"published",publishTime:new Date().toISOString(),updatedAt:new Date().toISOString()}:n)})),unpublishAnnouncement:e=>a(t=>({announcements:t.announcements.map(n=>n.id===e?{...n,status:"unpublished",updatedAt:new Date().toISOString()}:n)})),getAnnouncement:e=>s().announcements.find(t=>t.id===e)}),{name:"lijiang-announcements",storage:p(()=>localStorage),version:3,migrate:(a,s)=>s<3?{announcements:u}:a}));export{r as u};
