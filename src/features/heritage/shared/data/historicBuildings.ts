import { HeritageItem } from "../types"

export const historicBuildingsData: HeritageItem[] = [
  {
    id: "public-1",
    type: "historic-building",
    name: "文明坊(石狮子)",
    area: "大研古城（含黑龙潭）",
    location: { lat: 26.886804, lng: 100.232241 },
    heritageSubType: "公共建(构)筑物",
    address: "民主路1号黑龙潭内",
    preservationStatus: "优",
    description: `公园大门为光绪十一年重修的文庙牌坊——文明坊，由知府管学宣、教授万咸燕建。"咸丰间，文明坊毁于兵燹。光绪十一年（1885年）绅士重修。"1966年迁建于黑龙潭。原木府忠义坊前的四尊石狮于1966年迁移至此，跟文明坊共同组成了黑龙潭的大门。`,
    basicInfo: "文庙牌坊，石狮",
    photos: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=70",
      "https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?auto=format&fit=crop&w=800&q=70",
      "https://images.unsplash.com/photo-1548802673-380ab8ebc7b7?auto=format&fit=crop&w=800&q=70",
    ],
    extra: {
      buildingPattern: "单体建筑",
      propertyOwner: "国家所有",
      managementUnit: "三朵园林公司",
    },
  },
  {
    id: "public-2",
    type: "historic-building",
    name: "万古楼",
    area: "大研古城",
    location: { lat: 26.874522, lng: 100.231522 },
    heritageSubType: "公共建(构)筑物",
    address: "狮子山公园内",
    preservationStatus: "优",
    description: `万古楼建于当代，是狮子山公园的核心景观建筑。楼高约20米，采用纳西族传统建筑风格，飞檐翘角，雕梁画栋。登楼可俯瞰古城全貌，远眺玉龙雪山，是丽江旅游的标志性景点之一。`,
    basicInfo: "古城最高观景点，纳西建筑风格",
    photos: [
      "https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?auto=format&fit=crop&w=800&q=70",
      "https://images.unsplash.com/photo-1567696911989-2e77983f7088?auto=format&fit=crop&w=800&q=70",
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=70",
    ],
    extra: {
      buildingPattern: "楼阁建筑",
      propertyOwner: "政府所有",
      managementUnit: "古城管理局",
    },
  },
  {
    id: "public-3",
    type: "historic-building",
    name: "木府",
    area: "大研古城",
    location: { lat: 26.875523, lng: 100.234522 },
    heritageSubType: "公共建(构)筑物",
    address: "光义街官院巷52号",
    preservationStatus: "优",
    description: `木府是丽江木氏土司的府邸，始建于明洪武十五年（1382年）。府邸占地46亩，中轴线全长369米，建筑群包括办公区、生活区、花园等部分。1999年重修后对外开放，是了解纳西族土司文化的重要场所。`,
    basicInfo: "纳西族建筑典范，土司文化展示",
    photos: [
      "https://images.unsplash.com/photo-1567696911989-2e77983f7088?auto=format&fit=crop&w=800&q=70",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=70",
      "https://images.unsplash.com/photo-1528161344942-b5523058c97b?auto=format&fit=crop&w=800&q=70",
    ],
    extra: {
      buildingPattern: "多进院落",
      heritageElements: "明代建筑群，纳西-汉式融合",
      propertyOwner: "国家所有",
      managementUnit: "丽江古城管理局",
    },
  },
]

export default historicBuildingsData
