import { useState } from "react"
import { PageLayout } from "../../components/common/PageLayout"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../shared/components/ui/tabs"
import { NewsManageContent } from "./content/NewsManageContent"
import { RouteManageContent } from "./content/RouteManageContent"
import { CourtyardManageContent } from "./content/CourtyardManageContent"
import { MerchantManageContent } from "./content/MerchantManageContent"
import { POIManageContent } from "./content/POIManageContent"
import { HousingManageContent } from "./content/HousingManageContent"

export default function ContentManagePage() {
  const [tab, setTab] = useState("news")

  return (
    <PageLayout title="内容管理" description="管理C端展示的资讯、路线、院落、商户等内容">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="news">古城资讯</TabsTrigger>
          <TabsTrigger value="routes">精选路线</TabsTrigger>
          <TabsTrigger value="courtyards">文化院落</TabsTrigger>
          <TabsTrigger value="merchants">购在古城·商户</TabsTrigger>
          <TabsTrigger value="poi">导览地图POI</TabsTrigger>
          <TabsTrigger value="housing">公房信息</TabsTrigger>
        </TabsList>

        <TabsContent value="news"><NewsManageContent /></TabsContent>
        <TabsContent value="routes"><RouteManageContent /></TabsContent>
        <TabsContent value="courtyards"><CourtyardManageContent /></TabsContent>
        <TabsContent value="merchants"><MerchantManageContent /></TabsContent>
        <TabsContent value="poi"><POIManageContent /></TabsContent>
        <TabsContent value="housing"><HousingManageContent /></TabsContent>
      </Tabs>
    </PageLayout>
  )
}