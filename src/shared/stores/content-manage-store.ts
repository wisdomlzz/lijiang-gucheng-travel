import { create } from "zustand";
import type { TravelGuide, NewsItem, Courtyard, Merchant, ParkingLot, MapPOI } from "../types/content-types";

const DEFAULT_PARKINGS: ParkingLot[] = [
  {
    id: "p1", name: "古城北门停车场", type: "self_operated",
    size: "large", totalSpots: 320, availableSpots: 128,
    rate: "5元/小时", hours: "24小时", distance: "北门入口50m",
    address: "丽江市古城区北门停车场",
    lat: 26.8735, lng: 100.2325,
    createdAt: "2026-04-12 09:20",
    imageUrl: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=400&q=70",
    contactPhone: "0888-5104455",
    description: "靠近古城北门入口，适合从玉河广场、大水车方向进入古城的游客停车。",
    features: ["室内", "充电桩"], status: "open",
  },
  {
    id: "p2", name: "古城南门停车场", type: "self_operated",
    size: "large", totalSpots: 280, availableSpots: 74,
    rate: "5元/小时", hours: "06:00-22:00", distance: "南门入口30m",
    address: "丽江市古城区南门停车场",
    lat: 26.8650, lng: 100.2370,
    createdAt: "2026-04-10 14:00",
    imageUrl: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=400&q=70",
    contactPhone: "0888-5104466",
    description: "靠近古城南门步行入口，车位充足，适合团队客流和自驾游客临停。",
    features: ["室内"], status: "open",
  },
  {
    id: "p3", name: "白龙广场停车场", type: "third_party",
    size: "medium", totalSpots: 150, availableSpots: 36,
    rate: "6元/小时", hours: "08:00-20:00", distance: "步行至四方街5分钟",
    address: "丽江市古城区白龙广场",
    lat: 26.8680, lng: 100.2240,
    createdAt: "2026-04-08 17:30",
    imageUrl: "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=400&q=70",
    contactPhone: "0888-5104477",
    description: "第三方合作停车场，步行可达四方街片区，适合短时游览停车。",
    features: ["室外"], status: "open",
  },
  {
    id: "p4", name: "玉河广场停车场", type: "third_party",
    size: "small", totalSpots: 60, availableSpots: 0,
    rate: "8元/小时", hours: "08:00-22:00", distance: "古城中心",
    address: "丽江市古城区玉河广场",
    lat: 26.8720, lng: 100.2295,
    createdAt: "2026-04-06 11:40",
    imageUrl: "https://images.unsplash.com/photo-1560457063-2c5f4f6e7d82?auto=format&fit=crop&w=400&q=70",
    contactPhone: "0888-5104488",
    description: "位于古城核心游览区周边，高峰期容易满位，适合查看实时车位后再前往。",
    features: ["室外", "无障碍"], status: "full",
  },
  {
    id: "p5", name: "玉水坊地下商业停车场", type: "third_party",
    size: "large", totalSpots: 280, availableSpots: 280,
    rate: "20分钟内免费；60分钟内5元；60分钟以上5元/小时；80元/24小时",
    hours: "24小时", distance: "泰福巷",
    address: "云南省丽江市古城区泰福巷",
    lat: 26.878143, lng: 100.232093,
    createdAt: "2025-09-26 10:44:08",
    imageUrl: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=400&q=70",
    description: "1. 本停车场为地下停车场，只允许小型汽车停放，大型车辆请勿进入。\n2. 本停车场只提供停车位，无车辆管理人员，所收停车费不含任何管理费。\n3. 请您自行看管您的车辆和车内物品，如有车辆被盗、被撬和物品遗失、车辆刮等，本停车场概不负责。\n4. 请勿车载易燃、易爆、有毒物质进入本停车场。\n5. 停车不足一小时，按一小时收费。",
    features: ["室内", "小型汽车"], status: "open",
  },
];

const DEFAULT_GUIDES: TravelGuide[] = [
  {
    id: "1", name: "丽江古城热门打卡之旅",
    tags: ["热门", "摄影"],
    duration: "3小时", difficulty: "中等", stops: 6, distance: "2.4km",
    spotNames: ["大水车", "祈福桥", "四方街", "万古楼"],
    description: "带你一次走完古城最具代表性的六处热门地标，从大水车到万古楼，串起古城的历史脉络与烟火气息，适合初次来丽江的游客。",
    cover: "https://images.unsplash.com/photo-1663609968423-657ff4f0dd5a?auto=format&fit=crop&w=1200&q=70",
    hasVideo: true,
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    videoCoverUrl: "https://images.unsplash.com/photo-1663609968423-657ff4f0dd5a?auto=format&fit=crop&w=800&q=70",
    videoDuration: "03:45",
    contentBlocks: [
      { id: "cb1", type: "text", text: "丽江古城位于云南省丽江市古城区，是中国历史文化名城中保存最为完整的古城之一。古城始建于宋末元初，距今已有800多年的历史。\n\n漫步在古城的青石板路上，两侧是古朴的纳西族民居，潺潺的水渠穿城而过，构成了一幅「小桥流水人家」的诗意画卷。" },
      { id: "cb2", type: "image", imageUrl: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=70", imageCaption: "四方街夜色" },
      { id: "cb3", type: "video", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", videoCoverUrl: "https://images.unsplash.com/photo-AWinVtCXVQY?auto=format&fit=crop&w=800&q=70", videoCaption: "古城全景视频" },
      { id: "cb4", type: "text", text: "【游玩小贴士】\n1. 建议早上8点前进入古城，避开人流高峰\n2. 古城的石板路较多，建议穿舒适的平底鞋\n3. 品尝当地美食推荐：腊排骨、鸡豆凉粉、丽江粑粑\n4. 购买纪念品可以到忠义市场，价格相对实惠" },
      { id: "cb5", type: "image", imageUrl: "https://images.unsplash.com/photo-1552526881-5517a57c17ae?auto=format&fit=crop&w=800&q=70", imageCaption: "纳西族特色美食" },
    ],
    spots: [
      { id: "s1", name: "大水车", desc: "古城地标入口", top: "10%", left: "52%" },
      { id: "s2", name: "玉河广场", desc: "观景休憩点", top: "24%", left: "40%" },
      { id: "s3", name: "祈福桥", desc: "纳西风情桥", top: "38%", left: "60%" },
      { id: "s4", name: "四方街", desc: "古城核心商圈", top: "54%", left: "46%" },
      { id: "s5", name: "木府入口", desc: "土司府邸", top: "72%", left: "32%" },
      { id: "s6", name: "万古楼", desc: "古城至高点", top: "86%", left: "58%" },
    ],
  },
  {
    id: "2", name: "纳西王府深度研学路线",
    tags: ["深度", "文化"],
    duration: "4小时", difficulty: "较难", stops: 4, distance: "1.8km",
    spotNames: ["忠义坊", "木家院", "议事厅", "后花园"],
    description: "走进明清木氏土司府邸，由资深讲解员带领，系统了解纳西文化与木府六百年兴衰，适合亲子研学与深度文化爱好者。",
    cover: "https://images.unsplash.com/photo-1683825093397-5bbc64e496e6?auto=format&fit=crop&w=1200&q=70",
    spots: [
      { id: "s1", name: "忠义坊", desc: "木府正门牌坊", top: "14%", left: "50%" },
      { id: "s2", name: "议事厅", desc: "土司议政之所", top: "38%", left: "38%" },
      { id: "s3", name: "木家院", desc: "家族内宅", top: "62%", left: "56%" },
      { id: "s4", name: "后花园", desc: "园林景观", top: "86%", left: "44%" },
    ],
    contentBlocks: [
      { id: "cb6", type: "text", text: "木府是丽江古城的心脏所在，始建于元代，历经明清两代数百年扩建，最终成为占地46亩、气势恢宏的古代建筑群。明代旅行家徐霞客曾赞叹「宫室之丽，拟于王者」。" },
      { id: "cb7", type: "image", imageUrl: "https://images.unsplash.com/photo-pYDOOOPqTmU?auto=format&fit=crop&w=800&q=70", imageCaption: "木府议事厅外景" },
      { id: "cb8", type: "text", text: "【研学要点】\n1. 忠义坊：三间四柱石牌坊，象征木氏效忠朝廷\n2. 议事厅：土司处理政务之处，悬挂「诚心报国」匾额\n3. 万卷楼：藏书万卷，是纳西文化与中原文化交流的见证\n4. 后花园：结合江南园林与纳西庭院风格，四季花卉不断" },
    ],
  },
  {
    id: "3", name: "黑龙潭雪山倒影漫步",
    tags: ["摄影", "热门"],
    duration: "2小时", difficulty: "简单", stops: 5, distance: "1.5km",
    spotNames: ["五凤楼", "解脱林", "万寿亭", "龙神祠"],
    description: "沿黑龙潭湖畔漫步，远眺玉龙雪山在湖面的倒影，是拍照与静心散步的绝佳路线。晴天建议上午 9 点前到达。",
    cover: "https://images.unsplash.com/photo-1672843458713-7e225a484ae1?auto=format&fit=crop&w=1200&q=70",
    spots: [
      { id: "s1", name: "黑龙潭正门", desc: "入口", top: "8%", left: "50%" },
      { id: "s2", name: "五凤楼", desc: "明代古建", top: "28%", left: "40%" },
      { id: "s3", name: "解脱林", desc: "古树群", top: "48%", left: "58%" },
      { id: "s4", name: "万寿亭", desc: "湖心亭观景", top: "68%", left: "42%" },
      { id: "s5", name: "龙神祠", desc: "求福圣地", top: "88%", left: "54%" },
    ],
    contentBlocks: [
      { id: "cb9", type: "text", text: "黑龙潭位于丽江古城北端象山脚下，始建于清代乾隆年间，因泉水从石缝中涌出汇集成潭而得名。潭水清澈见底，玉龙雪山倒映其中，是摄影爱好者的天堂。" },
      { id: "cb10", type: "image", imageUrl: "https://images.unsplash.com/photo-1672843458713-7e225a484ae1?auto=format&fit=crop&w=800&q=70", imageCaption: "黑龙潭玉龙雪山倒影" },
      { id: "cb11", type: "text", text: "【拍摄攻略】\n1. 最佳时间：上午8-10点，无风时湖面如镜，雪山倒影最清晰\n2. 最佳机位：万寿亭前左侧，以五孔桥为前景\n3. 春季潭边樱花盛开，秋季红叶映水，各具特色\n4. 使用偏振镜(CPL)可消除水面反光，使倒影更通透" },
    ],
  },
  {
    id: "4", name: "寻味古城·非遗美食品鉴",
    tags: ["美食", "热门"],
    duration: "5小时", difficulty: "较难", stops: 8, distance: "3.2km",
    spotNames: ["忠义市场", "鸡豆凉粉", "丽江粑粑", "酥油茶"],
    description: "跟着吃货达人走访古城八大必吃小店，涵盖纳西正餐、传统小吃与茶饮，带你从早到晚吃遍古城。",
    cover: "https://images.unsplash.com/photo-1552526881-5517a57c17ae?auto=format&fit=crop&w=1200&q=70",
    spots: [
      { id: "s1", name: "忠义市场", desc: "食材集散地", top: "10%", left: "48%" },
      { id: "s2", name: "阿妈意饭店", desc: "纳西火锅", top: "22%", left: "60%" },
      { id: "s3", name: "鸡豆凉粉", desc: "经典小吃", top: "34%", left: "36%" },
      { id: "s4", name: "丽江粑粑", desc: "老字号", top: "46%", left: "56%" },
      { id: "s5", name: "五一街茶馆", desc: "下午茶", top: "58%", left: "42%" },
      { id: "s6", name: "酥油茶坊", desc: "纳西传统", top: "70%", left: "60%" },
      { id: "s7", name: "鲜花饼店", desc: "伴手礼", top: "82%", left: "38%" },
      { id: "s8", name: "酒吧一条街", desc: "夜宵收尾", top: "92%", left: "52%" },
    ],
    contentBlocks: [
      { id: "cb12", type: "text", text: "古城的美食不止在餐厅里，更藏在街头巷尾的小摊和老店里。从清晨的鸡豆凉粉到深夜的腊排骨火锅，这条路线带你从早到晚吃遍丽江。" },
      { id: "cb13", type: "image", imageUrl: "https://images.unsplash.com/photo-1552526881-5517a57c17ae?auto=format&fit=crop&w=800&q=70", imageCaption: "丽江特色美食集锦" },
      { id: "cb14", type: "text", text: "【必吃清单】\n1. 鸡豆凉粉：丽江独有小吃，用鸡豆磨浆制成，口感爽滑，配辣椒油食用\n2. 丽江粑粑：分甜咸两种，传统炭火烤制，外酥内软\n3. 腊排骨火锅：纳西传统美食，选用高原土猪腌制，汤鲜味浓\n4. 酥油茶：纳西族日常饮品，牦牛酥油与砖茶混合，咸香可口\n5. 鲜花饼：用食用玫瑰花瓣做馅，现烤最佳，也是绝佳伴手礼" },
      { id: "cb15", type: "video", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", videoCoverUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=70", videoCaption: "纳西传统美食制作过程" },
    ],
  },
];

const DEFAULT_NEWS: NewsItem[] = [
  { id: "1", imageUrl: "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=800&q=70", title: "丽江古城12处直管公房公开招租公告", tag: "热门活动", tagColor: "#3B82F6", date: "2026-04-21", summary: "丽江古城旅游发展有限责任公司直管公房12处拟面向社会公开招租，现将相关事项公告如下", category: "公房公告", heroTitle: "丽江古城旅游前服务", body: ["丽江古城旅游发展有限责任公司直管公房12处拟面向社会公开招租，现将相关事项公告如下：", "一、招租房产位于丽江古城核心保护区，具体门牌号及使用面积详见附件清单。", "二、租赁期限为三年，起租日期以合同签订之日起算，期满后可根据经营情况协商续租。", "三、凡有意承租者，请于公告发布之日起 15 日内持营业执照、法人身份证等相关资料至古城管理局一楼大厅办理登记手续。", "四、本次招租采取公开竞价方式进行，最终中标以综合评分最高者为准，欢迎广大商户踊跃参与。", "五、联系电话：0888-5111111，联系人：李主任。"], subImage: "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=800&q=70" },
  { id: "2", imageUrl: "https://images.unsplash.com/photo-1663609968423-657ff4f0dd5a?auto=format&fit=crop&w=800&q=70", title: "丽江古城有限公司直管公房公开招租相关公告", tag: "优惠活动", tagColor: "#10B981", date: "2026-04-21", summary: "本次公告面向古城五一街、新华街片区公房进行公开招租", category: "公房公告", heroTitle: "丽江古城旅游前服务", body: ["本次公告面向古城五一街、新华街片区公房进行公开招租，房源涵盖临街铺面与庭院四合院两类。", "投标人须具备独立法人资格，近三年无重大违法违规经营记录。", "详情请至古城管理局官方网站或现场办公大厅查询。"], subImage: "https://images.unsplash.com/photo-1663609968423-657ff4f0dd5a?auto=format&fit=crop&w=800&q=70" },
  { id: "3", imageUrl: "https://images.unsplash.com/photo-1683825093397-5bbc64e496e6?auto=format&fit=crop&w=800&q=70", title: "丽江古城直管公房公开招租相关公告（原魔代医院）", tag: "公告", tagColor: "#64748B", date: "2026-04-20", summary: "原魔代医院地块公房整体拟公开招租", category: "公房公告", heroTitle: "丽江古城旅游前服务", body: ["原魔代医院地块公房整体拟公开招租，总建筑面积约 1280 ㎡，适合文化展示、非遗体验类业态。", "租赁方需在投标时提交详细业态规划方案，由评审委员会综合评定。"], subImage: "https://images.unsplash.com/photo-1683825093397-5bbc64e496e6?auto=format&fit=crop&w=800&q=70" },
  { id: "4", imageUrl: "https://images.unsplash.com/photo-AWinVtCXVQY?auto=format&fit=crop&w=800&q=70", title: "古城春日文化节开幕", tag: "热门活动", tagColor: "#3B82F6", date: "04-25", summary: "丽江古城春日文化节将于4月25日盛大开幕，精彩活动等您参与", category: "其它", body: ["丽江古城春日文化节将于4月25日盛大开幕，精彩活动等您参与"], subImage: "https://images.unsplash.com/photo-AWinVtCXVQY?auto=format&fit=crop&w=800&q=70" },
  { id: "5", imageUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=70", title: "新义街三层老宅整院出租 · 年租 18 万", tag: "房屋信息", tagColor: "#F97316", date: "2026-04-19", summary: "本院位于新义街核心地段，三进院落，产权清晰，适合客栈或文创业态", category: "房屋信息", heroTitle: "古城老宅出租信息", body: ["本院位于新义街核心地段，三进院落，产权清晰，适合客栈或文创业态。", "联系电话：138-8888-1234，非诚勿扰。"], subImage: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=70" },
  { id: "6", imageUrl: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=800&q=70", title: "古城文创店招聘店员", tag: "举贤纳仕", tagColor: "#10B981", date: "2026-04-15", summary: "古城文创店招聘店员，要求熟悉旅游接待和本地文创产品", category: "举贤纳仕", heroTitle: "古城文创店招聘", body: ["古城文创店招聘店员，要求熟悉旅游接待和本地文创产品。", "岗位要求：普通话流利，能进行简单英语沟通者优先。"], subImage: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=800&q=70" },
  { id: "7", imageUrl: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=70", title: "关于古城水系清淤维护的通知", tag: "通知", tagColor: "#64748B", date: "2026-04-12", summary: "4 月 25 日 - 4 月 28 日对四方街至玉河广场段水系进行清淤", category: "其它", heroTitle: "古城水系维护通知", body: ["4 月 25 日 - 4 月 28 日对四方街至玉河广场段水系进行清淤，期间部分区域水流暂停。", "给您的游览带来的不便敬请谅解。"], subImage: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=70" },
  { id: "8", imageUrl: "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=800&q=70", title: "古城春日文化节即将开幕", tag: "热门活动", tagColor: "#3B82F6", date: "04-25", summary: "丽江古城春日文化节将于4月25日盛大开幕，精彩活动等您参与", category: "其它", body: ["丽江古城春日文化节将于4月25日盛大开幕，精彩活动等您参与"], subImage: "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=800&q=70" },
  { id: "9", imageUrl: "https://images.unsplash.com/photo-AWinVtCXVQY?auto=format&fit=crop&w=800&q=70", title: "公房出租公告", tag: "公告", tagColor: "#64748B", date: "04-12", summary: "丽江古城公房出租，欢迎咨询", category: "公房公告", body: ["丽江古城公房出租，欢迎咨询。"], subImage: "https://images.unsplash.com/photo-AWinVtCXVQY?auto=format&fit=crop&w=800&q=70" },
  { id: "10", imageUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=70", title: "古城游览安全提醒", tag: "公告", tagColor: "#2563EB", date: "04-10", summary: "游览古城请注意人身财产安全，保管好贵重物品", category: "其它", body: ["游览古城请注意人身财产安全，保管好贵重物品。夜间游览请关注沿街照明和人流变化，如遇突发情况可联系服务点工作人员。"], subImage: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=70" },
];

const DEFAULT_COURTYARDS: Courtyard[] = [
  {
    id: "1",
    name: "木府",
    title: "纳西王府",
    tags: ["历史建筑", "纳西文化"],
    tagContent: "明代木氏土司府邸，是丽江古城文化展示的重要节点。",
    summary: "纳西族土司府邸，了解丽江历史文化的重要窗口。",
    description: "木府是丽江古城之心脏，原为明代木氏土司府邸，建筑群气势恢宏，被誉为\u201C丽江紫禁城\u201D。木府见证了纳西族与中原文化的交融，是了解丽江历史的重要窗口。",
    location: "古城光义街官门口",
    hours: "08:30-17:30",
    createdAt: "2026-04-09 10:15",
    imageUrl: "https://images.unsplash.com/photo-1683825093397-5bbc64e496e6?auto=format&fit=crop&w=600&q=70",
    phone: "0888-5123456",
    vrImageUrl: "https://images.unsplash.com/photo-1683825093397-5bbc64e496e6?auto=format&fit=crop&w=1600&q=80",
    audioGuideUrl: "https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav",
    remark: "旺季建议提前预约，团队参观需错峰入场。",
    gallery: [
      "https://images.unsplash.com/photo-1683825093397-5bbc64e496e6?auto=format&fit=crop&w=800&q=70",
      "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=70",
      "https://images.unsplash.com/photo-1663609968423-657ff4f0dd5a?auto=format&fit=crop&w=800&q=70",
    ],
    contentBlocks: [
      { id: "cb1", type: "text", text: "木府是丽江古城之心脏，原为明代木氏土司府邸，建筑群气势恢宏，被誉为\u201C丽江紫禁城\u201D。木府见证了纳西族与中原文化的交融，是了解丽江历史的重要窗口。\n\n木府始建于元代，历经明清两代数百年扩建，最终成为占地46亩、气势恢宏的古代建筑群。明代旅行家徐霞客曾赞叹\u201C宫室之丽，拟于王者\u201D。" },
      { id: "cb2", type: "image", imageUrl: "https://images.unsplash.com/photo-1683825093397-5bbc64e496e6?auto=format&fit=crop&w=800&q=70", imageCaption: "木府正门" },
      { id: "cb3", type: "text", text: "府内主要建筑有忠义坊、议事厅、万卷楼、护法殿等，沿中轴线依次排列，层层递进。后院是典型的纳西庭院园林，假山流水，花木扶疏。" },
      { id: "cb4", type: "image", imageUrl: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=70", imageCaption: "木府议事厅内景" },
      { id: "cb5", type: "image", imageUrl: "https://images.unsplash.com/photo-1663609968423-657ff4f0dd5a?auto=format&fit=crop&w=800&q=70", imageCaption: "木府俯瞰全景" },
    ],
    lat: 26.8685,
    lng: 100.2312,
  },
  {
    id: "2",
    name: "方国瑜故居",
    title: "方国瑜故居",
    tags: ["名人故居", "文史展陈"],
    tagContent: "展示方国瑜先生手稿、著作与纳西历史研究资料。",
    summary: "纳西族历史学家方国瑜先生故居，保留珍贵手稿与文献。",
    description: "著名纳西族历史学家方国瑜先生的故居，保留了大量珍贵手稿与历史文献。故居始建于清代，展示了纳西族学者的治学精神与文化传承。",
    location: "五一街文治巷42号",
    hours: "09:00-17:00",
    createdAt: "2026-04-11 16:20",
    imageUrl: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&q=70",
    phone: "0888-5123457",
    vrImageUrl: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1600&q=80",
    audioGuideUrl: "",
    remark: "室内展陈空间较小，雨天注意院内台阶湿滑。",
    gallery: [
      "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=70",
      "https://images.unsplash.com/photo-1663609968423-657ff4f0dd5a?auto=format&fit=crop&w=800&q=70",
    ],
    contentBlocks: [
      { id: "cb6", type: "text", text: "著名纳西族历史学家方国瑜先生的故居，保留了大量珍贵手稿与历史文献。故居始建于清代，展示了纳西族学者的治学精神与文化传承。\n\n方国瑜先生是中国著名的历史学家、民族学家，毕生致力于纳西族历史文化研究，其学术著作对后世影响深远。" },
      { id: "cb7", type: "image", imageUrl: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=70", imageCaption: "方国瑜故居外景" },
      { id: "cb8", type: "text", text: "故居为典型纳西族四合院布局，三坊一照壁，院内青砖铺地，花木葱茏。室内陈列着方国瑜先生的著作手稿、学术笔记以及生前使用过的物品，具有极高的文史价值。" },
      { id: "cb9", type: "image", imageUrl: "https://images.unsplash.com/photo-1663609968423-657ff4f0dd5a?auto=format&fit=crop&w=800&q=70", imageCaption: "故居内院" },
    ],
    lat: 26.8692,
    lng: 100.2356,
  },
  {
    id: "3",
    name: "纳西古乐会",
    title: "纳西古乐",
    tags: ["非遗演艺", "夜间游览"],
    tagContent: "以纳西古乐现场演奏为核心，适合夜间文化体验。",
    summary: "每晚上演原生态纳西古乐表演，展示古老音乐文化。",
    description: "每晚在古城内上演的原生态纳西古乐表演，被誉为\u201C音乐活化石\u201D。由纳西族老艺人演奏千年古乐，传承古老的纳西音乐文化。",
    location: "古城新义街纳西古乐会",
    hours: "20:00-21:30",
    createdAt: "2026-04-14 19:00",
    imageUrl: "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=600&q=70",
    phone: "0888-5123458",
    vrImageUrl: "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=1600&q=80",
    audioGuideUrl: "",
    remark: "演出场次受节庆活动影响，以现场公告为准。",
    gallery: [
      "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=800&q=70",
      "https://images.unsplash.com/photo-1552526881-5517a57c17ae?auto=format&fit=crop&w=800&q=70",
    ],
    contentBlocks: [
      { id: "cb10", type: "text", text: "每晚在古城内上演的原生态纳西古乐表演，被誉为\u201C音乐活化石\u201D。由纳西族老艺人演奏千年古乐，传承古老的纳西音乐文化。\n\n纳西古乐起源于唐代，融合了道教音乐、宫廷音乐和纳西族民间音乐的元素，是中国现存最古老的音乐之一。2005年被列为国家级非物质文化遗产。" },
      { id: "cb11", type: "image", imageUrl: "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=800&q=70", imageCaption: "纳西古乐演奏现场" },
      { id: "cb12", type: "text", text: "演出曲目包括《八卦》、《浪淘沙》、《山坡羊》等经典古曲。乐手们身着传统纳西服饰，演奏乐器有苏古笃、曲项琵琶、竹笛等，音色古朴悠远，令人陶醉。" },
      { id: "cb13", type: "image", imageUrl: "https://images.unsplash.com/photo-1552526881-5517a57c17ae?auto=format&fit=crop&w=800&q=70", imageCaption: "纳西传统乐器" },
    ],
    lat: 26.8668,
    lng: 100.2298,
  },
  {
    id: "4",
    name: "雪山书院",
    title: "雪山书院",
    tags: ["书院文化", "研学"],
    tagContent: "清代官办学堂旧址，适合研学参观和文化讲座。",
    summary: "清代丽江最早官办学堂，保留藏书与讲学功能。",
    description: "清代丽江最早的官办学堂，至今仍保留藏书、讲学功能。书院内古木参天，庭院幽静，是感受纳西传统教育文化的绝佳场所。",
    location: "五一街文治巷15号",
    hours: "09:00-18:00",
    createdAt: "2026-04-16 09:40",
    imageUrl: "https://images.unsplash.com/photo-1663609968423-657ff4f0dd5a?auto=format&fit=crop&w=600&q=70",
    phone: "0888-5123459",
    vrImageUrl: "https://images.unsplash.com/photo-1663609968423-657ff4f0dd5a?auto=format&fit=crop&w=1600&q=80",
    audioGuideUrl: "",
    remark: "讲座活动需提前关注预约通知。",
    gallery: [
      "https://images.unsplash.com/photo-1663609968423-657ff4f0dd5a?auto=format&fit=crop&w=800&q=70",
    ],
    contentBlocks: [
      { id: "cb14", type: "text", text: "清代丽江最早的官办学堂，至今仍保留藏书、讲学功能。书院内古木参天，庭院幽静，是感受纳西传统教育文化的绝佳场所。\n\n雪山书院由丽江知府于清雍正年间创办，是丽江古城历史上第一所官办学校。书院培养了大批纳西族文人学士，对推动边疆文化教育发展起到了重要作用。" },
      { id: "cb15", type: "image", imageUrl: "https://images.unsplash.com/photo-1663609968423-657ff4f0dd5a?auto=format&fit=crop&w=800&q=70", imageCaption: "雪山书院正门" },
      { id: "cb16", type: "text", text: "书院现存建筑为清代风格，三进院落依次升高。正堂悬挂\u201C万世师表\u201D匾额，两侧厢房为藏书室和讲堂。庭院中古柏参天，环境清幽，至今仍定期举办国学讲座和文化雅集。" },
    ],
    lat: 26.8695,
    lng: 100.2368,
  },
];

const DEFAULT_POIS: MapPOI[] = [
  { id: "poi1", name: "大水车", category: "scenic_spot", lat: 26.872, lng: 100.232, location: "古城北入口", openTime: "全天开放", phone: "0888-5101122", createdAt: "2026-04-05 09:30", description: "丽江古城标志性景观，位于古城北入口", imageUrl: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400", audioCnUrl: "大水车中文语音.mp3", audioEnUrl: "Waterwheel English audio.mp3", status: "active" },
  { id: "poi2", name: "四方街", category: "scenic_spot", lat: 26.870, lng: 100.230, location: "古城核心区", openTime: "全天开放", phone: "0888-5102233", createdAt: "2026-04-07 15:10", description: "古城中心广场，商贾云集", imageUrl: "https://images.unsplash.com/photo-1552526881-5517a57c17ae?w=400", audioCnUrl: "四方街中文语音.mp3", audioEnUrl: "Sifang Street English audio.mp3", status: "active" },
  { id: "poi3", name: "木府", category: "scenic_spot", lat: 26.867, lng: 100.228, location: "光义街官门口", openTime: "08:30-17:30", phone: "0888-5103344", createdAt: "2026-04-11 10:00", description: "纳西族土司府邸，古城文化核心", imageUrl: "https://images.unsplash.com/photo-1683825093397-5bbc64e496e6?w=400", audioCnUrl: "木府中文语音.mp3", audioEnUrl: "Mufu English audio.mp3", status: "active" },
  { id: "poi4", name: "北门停车场", category: "facility", lat: 26.8735, lng: 100.2325, location: "古城北入口旁", openTime: "24小时", phone: "0888-5104455", createdAt: "2026-04-06 08:45", description: "大型停车场，320个车位", status: "active" },
  { id: "poi5", name: "游客服务中心", category: "service", lat: 26.871, lng: 100.233, location: "玉河广场服务区", openTime: "08:30-22:00", phone: "0888-5105566", createdAt: "2026-04-03 13:20", description: "提供咨询、寄存、轮椅租借等服务", status: "active" },
]

const DEFAULT_MERCHANTS: Merchant[] = [
  {
    id: "1", name: "纳西人家餐厅", category: "food", source: "后台添加", reviewStatus: "通过", publishedAt: "2026-04-18 11:20",
    logo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop",
    cover: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop",
    description: "纳西人家餐厅创立于1998年，专注地道纳西风味美食。招牌腊排骨火锅选用当地优质食材，传承纳西传统烹饪技艺。",
    address: "五一街文明巷88号", phone: "0888-5123456", hours: "10:00 - 22:00",
    vrImageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&h=800&fit=crop",
    rating: 4.8, reviewCount: 1286, creditScore: 88, openYear: 1998, distance: "230m",
    lat: 26.8758, lng: 100.2362,
    gallery: [
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=600&fit=crop",
    ],
    certificates: [
      { type: "business", label: "营业执照", no: "91530702MA6***XXQ", validUntil: "长期有效", img: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop" },
      { type: "food", label: "食品经营许可证", no: "JY15307024***234", validUntil: "2028-06-30", img: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&h=400&fit=crop" },
      { type: "honor", label: "古城诚信商户", no: "LJGC-2024-0086", validUntil: "2026-12-31", img: "https://images.unsplash.com/photo-1606237946016-8d4a0d5e2e3f?w=600&h=400&fit=crop" },
    ],
  },
  {
    id: "2", name: "古城客栈", category: "hotel", source: "商家提交", reviewStatus: "通过", publishedAt: "2026-04-17 16:40",
    logo: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&h=200&fit=crop",
    cover: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&h=400&fit=crop",
    description: "古典纳西庭院，观景房俯瞰古城",
    address: "新华街崇仁巷67号", phone: "0888-5234567", hours: "全天",
    vrImageUrl: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1600&h=800&fit=crop",
    rating: 4.7, reviewCount: 832, creditScore: 85, openYear: 2012, distance: "450m",
    lat: 26.8762, lng: 100.2318,
    gallery: [], certificates: [],
  },
  {
    id: "3", name: "东巴纸坊", category: "shopping", source: "后台添加", reviewStatus: "通过", publishedAt: "2026-04-15 09:10",
    logo: "https://images.unsplash.com/photo-1555421689-d68471e189f2?w=200&h=200&fit=crop",
    cover: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=600&h=400&fit=crop",
    description: "手工东巴纸制作体验",
    address: "七一街八一巷", phone: "139-8888-5678", hours: "09:00-21:00",
    qualificationText: "营业执照、古城诚信商户备案",
    productImageUrl: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&h=600&fit=crop",
    rating: 4.9, reviewCount: 524, creditScore: 92, openYear: 2015, distance: "680m",
    lat: 26.8738, lng: 100.2378,
    gallery: [], certificates: [],
  },
  {
    id: "4", name: "雪山清吧", category: "bar", source: "后台添加", reviewStatus: "通过", publishedAt: "2026-04-19 20:00",
    logo: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=200&h=200&fit=crop",
    cover: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600&h=400&fit=crop",
    description: "民谣驻唱，精选鸡尾酒",
    address: "五一街振兴巷12号", phone: "139-8888-9012", hours: "18:00-02:00",
    relatedUser: "古城文创·王老板",
    barType: "民谣清吧", boothCount: 16, seatCount: 48, performanceStartTime: "20:30", performanceDuration: "20:30-23:30",
    rating: 4.9, reviewCount: 1052, creditScore: 90, openYear: 2018, distance: "320m",
    lat: 26.8752, lng: 100.2358,
    gallery: [], certificates: [],
  },
  {
    id: "5", name: "木府茶室", category: "food", source: "商家提交", reviewStatus: "待审核", publishedAt: "2026-04-20 14:30",
    logo: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=200&h=200&fit=crop",
    cover: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop",
    description: "普洱茶品鉴，纳西小吃",
    address: "木府附近", phone: "0888-5345678", hours: "10:00-20:00",
    vrImageUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=1600&h=800&fit=crop",
    rating: 4.6, reviewCount: 318, creditScore: 82, openYear: 2020, distance: "540m",
    lat: 26.8748, lng: 100.2342,
    gallery: [], certificates: [],
  },
  {
    id: "6", name: "古城文创集合店", category: "shopping", source: "后台添加", reviewStatus: "通过", publishedAt: "2026-04-16 18:15",
    logo: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop",
    cover: "https://images.unsplash.com/photo-1481437156560-3205f6a55735?w=600&h=400&fit=crop",
    description: "原创手工艺品、纳西文化周边",
    address: "四方街", phone: "139-8888-3456", hours: "09:00-22:00",
    qualificationText: "营业执照、文创商品备案",
    productImageUrl: "https://images.unsplash.com/photo-1481437156560-3205f6a55735?w=800&h=600&fit=crop",
    rating: 4.7, reviewCount: 687, creditScore: 88, openYear: 2016, distance: "150m",
    lat: 26.8756, lng: 100.2326,
    gallery: [], certificates: [],
  },
];

interface ContentManageState {
  guides: TravelGuide[];
  news: NewsItem[];
  courtyards: Courtyard[];
  merchants: Merchant[];
  parkings: ParkingLot[];
  pois: MapPOI[];
  addGuide: (item: TravelGuide) => void;
  updateGuide: (id: string, fields: Partial<TravelGuide>) => void;
  deleteGuide: (id: string) => void;
  addNews: (item: NewsItem) => void;
  updateNews: (id: string, fields: Partial<NewsItem>) => void;
  deleteNews: (id: string) => void;
  addCourtyard: (item: Courtyard) => void;
  updateCourtyard: (id: string, fields: Partial<Courtyard>) => void;
  deleteCourtyard: (id: string) => void;
  addMerchant: (item: Merchant) => void;
  updateMerchant: (id: string, fields: Partial<Merchant>) => void;
  deleteMerchant: (id: string) => void;
  addParking: (item: ParkingLot) => void;
  updateParking: (id: string, fields: Partial<ParkingLot>) => void;
  deleteParking: (id: string) => void;
  addPOI: (item: MapPOI) => void;
  updatePOI: (id: string, fields: Partial<MapPOI>) => void;
  deletePOI: (id: string) => void;
}

let nextId = 100;

export const useContentManageStore = create<ContentManageState>((set) => ({
  guides: DEFAULT_GUIDES.map((g) => ({ ...g, spots: g.spots.map((s) => ({ ...s })) })),
  news: DEFAULT_NEWS.map((n) => ({ ...n, body: n.body ? [...n.body] : undefined })),
  courtyards: DEFAULT_COURTYARDS.map((c) => ({ ...c })),
  merchants: DEFAULT_MERCHANTS.map((m) => ({ ...m, gallery: [...m.gallery], certificates: m.certificates.map((c) => ({ ...c })) })),
  parkings: DEFAULT_PARKINGS.map((p) => ({ ...p, features: p.features ? [...p.features] : [] })),
  pois: DEFAULT_POIS.map((p) => ({ ...p })),

  addGuide: (item) => set((s) => ({ guides: [...s.guides, { ...item, id: String(nextId++) }] })),
  updateGuide: (id, fields) => set((s) => ({ guides: s.guides.map((g) => (g.id === id ? { ...g, ...fields } : g)) })),
  deleteGuide: (id) => set((s) => ({ guides: s.guides.filter((g) => g.id !== id) })),

  addNews: (item) => set((s) => ({ news: [...s.news, { ...item, id: String(nextId++) }] })),
  updateNews: (id, fields) => set((s) => ({ news: s.news.map((n) => (n.id === id ? { ...n, ...fields } : n)) })),
  deleteNews: (id) => set((s) => ({ news: s.news.filter((n) => n.id !== id) })),

  addCourtyard: (item) => set((s) => ({ courtyards: [...s.courtyards, { ...item, id: String(nextId++) }] })),
  updateCourtyard: (id, fields) => set((s) => ({ courtyards: s.courtyards.map((c) => (c.id === id ? { ...c, ...fields } : c)) })),
  deleteCourtyard: (id) => set((s) => ({ courtyards: s.courtyards.filter((c) => c.id !== id) })),

  addMerchant: (item) => set((s) => ({ merchants: [...s.merchants, { ...item, id: String(nextId++) }] })),
  updateMerchant: (id, fields) => set((s) => ({ merchants: s.merchants.map((m) => (m.id === id ? { ...m, ...fields } : m)) })),
  deleteMerchant: (id) => set((s) => ({ merchants: s.merchants.filter((m) => m.id !== id) })),

  addParking: (item) => set((s) => ({ parkings: [...s.parkings, { ...item, id: String(nextId++) }] })),
  updateParking: (id, fields) => set((s) => ({ parkings: s.parkings.map((p) => (p.id === id ? { ...p, ...fields } : p)) })),
  deleteParking: (id) => set((s) => ({ parkings: s.parkings.filter((p) => p.id !== id) })),

  addPOI: (item) => set((s) => ({ pois: [...s.pois, { ...item, id: String(nextId++) }] })),
  updatePOI: (id, fields) => set((s) => ({ pois: s.pois.map((p) => (p.id === id ? { ...p, ...fields } : p)) })),
  deletePOI: (id) => set((s) => ({ pois: s.pois.filter((p) => p.id !== id) })),
}));
