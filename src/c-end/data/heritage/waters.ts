import { HeritageItem } from '../../types/heritage';

export const watersData: HeritageItem[] = [
  {
    id: 'water-1',
    type: 'water',
    name: '黑龙潭',
    area: '大研',
    location: { lat: 26.879763, lng: 100.231997 },
    description: `黑龙潭和白马龙潭均系古城的面状水系。黑龙潭位于丽江城北象山脚下，又名玉泉公园，旧名玉泉龙王庙。因获清嘉庆、光绪两朝皇帝御赐加封"龙神"而得名，后改称黑龙潭。象山下栎树葱笼，水源从山麓古老的栎树丛下岩石间喷涌而出，有数十个出水点，出水量为1.918~4.43立方米/秒，汇成潭面近5万平方米，水质清纯甘美，水碧如玉，故称玉泉。该潭为玉河水主要源头，可调节玉河水系的流量。2005年扩容后，黑龙潭由原面积70亩的基础上，扩建至112亩，景点水塘增至7个，绿化面积达16000平方米，为进一步满足城市供水和古城景观用水创造了条件。`,
    basicInfo: '玉河水主要源头，2005年扩容至112亩',
    photos: [
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=70',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=70',
      'https://images.unsplash.com/photo-1583037189850-1921ae7c6c21?auto=format&fit=crop&w=800&q=70'
    ],
    drawings: [
      '1、遗产保护/2、水系\大研-黑龙潭\黑龙潭图纸.png'
    ],
    extra: {
      flowDirection: '/',
    },
  },
  {
    id: 'water-2',
    type: 'water',
    name: '玉河',
    area: '大研',
    location: { lat: 26.876000, lng: 100.235000 },
    description: `玉河发源于黑龙潭，是丽江古城水系的主动脉。从黑龙潭流出后，分为东河、中河、西河三条支流穿城而过，灌溉古城至大研镇。玉河水系是古城居民生活用水的重要来源，也是古城生态环境的核心载体。河水清澈见底，两岸垂柳依依，构成丽江古城独特的山水空间格局。`,
    basicInfo: '主干河，引自黑龙潭水源',
    photos: [
      'https://images.unsplash.com/photo-1583037189850-1921ae7c6c21?auto=format&fit=crop&w=800&q=70',
      'https://images.unsplash.com/photo-1528161344942-b5523058c97b?auto=format&fit=crop&w=800&q=70',
      'https://images.unsplash.com/photo-1567696911989-2e77983f7088?auto=format&fit=crop&w=800&q=70'
    ],
    drawings: [
      '1、遗产保护/2、水系\玉河\玉河水系图.png'
    ],
    extra: {
      flowDirection: '南向北',
    },
  },
  {
    id: 'water-3',
    type: 'water',
    name: '中河',
    area: '大研',
    location: { lat: 26.874000, lng: 100.234000 },
    description: `中河是玉河三大分流之一，从玉龙桥处分出，流经古城繁华地段。两旁为传统民居和商铺，水上架有多座小桥，形成"小桥流水人家"的典型景观。河水清澈，居民沿河洗涤，保留了古城传统生活方式。`,
    basicInfo: '古城核心水道，商业繁荣',
    photos: [
      'https://images.unsplash.com/photo-1528161344942-b5523058c97b?auto=format&fit=crop&w=800&q=70',
      'https://images.unsplash.com/photo-1548802673-380ab8ebc7b7?auto=format&fit=crop&w=800&q=70',
      'https://images.unsplash.com/photo-1536634518009-96cde641b145?auto=format&fit=crop&w=800&q=70'
    ],
    extra: {
      flowDirection: '北向南',
    },
  },
  {
    id: 'water-4',
    type: 'water',
    name: '西河',
    area: '大研',
    location: { lat: 26.873500, lng: 100.232000 },
    description: `西河为玉河西路支流，在古城西部穿行。经过四方街西侧，是历史上清洗四方街的主要水源。河岸两侧保留了大量传统民居，水质清澈，是古城居民日常用水的重要渠道。`,
    basicInfo: '四方街清洗水源，传统民居密集区',
    photos: [
      'https://images.unsplash.com/photo-1536634518009-96cde641b145?auto=format&fit=crop&w=800&q=70',
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=70',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=70'
    ],
    extra: {
      flowDirection: '北向南',
    },
  },
  {
    id: 'water-5',
    type: 'water',
    name: '东河',
    area: '大研',
    location: { lat: 26.875500, lng: 100.236000 },
    description: `东河为玉河东路支流，主要流经古城东部区域。河岸两侧以住宅为主，环境幽静，水质清澈，两岸保留了大量的古柳树，形成独特的滨水景观。东河是古城居民保存最为完好的水系之一。`,
    basicInfo: '古城东部水系，古柳众多',
    photos: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=70',
      'https://images.unsplash.com/photo-1567696911989-2e77983f7088?auto=format&fit=crop&w=800&q=70'
    ],
    extra: {
      flowDirection: '北向南',
    },
  },
  {
    id: 'water-6',
    type: 'water',
    name: '白马龙潭',
    area: '大研',
    location: { lat: 26.882000, lng: 100.228000 },
    description: `白马龙潭与黑龙潭并称为丽江古城"玉泉双璧"。潭水清澈，泉水从地下涌出，形成天然水塘。潭边古木参天，环境清幽，是古城居民休闲游憩的好去处。白马龙潭水源充沛，历史上曾是古城重要的生活用水来源。`,
    basicInfo: '玉泉双璧之一，古木参天',
    photos: [
      'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=70',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=70',
      'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?auto=format&fit=crop&w=800&q=70'
    ],
    extra: {
      flowDirection: '/',
    },
  },
];

export default watersData;
