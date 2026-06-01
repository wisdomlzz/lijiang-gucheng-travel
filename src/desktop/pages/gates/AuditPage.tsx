import { useState, useMemo } from "react";
import { Card } from "../../../shared/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../shared/components/ui/table";
import { Button } from "../../../shared/components/ui/button";
import { Badge } from "../../../shared/components/ui/badge";
import { PageHeader } from "../../components/common/PageHeader";
import { DataToolbar } from "../../components/common/DataToolbar";
import { auditLogs } from "../../lib/mock";

export default function AuditPage() {
  const [search, setSearch] = useState("");

  const filteredLogs = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return auditLogs;
    return auditLogs.filter((l) =>
      l.operator.toLowerCase().includes(keyword) ||
      l.op.toLowerCase().includes(keyword) ||
      l.target.toLowerCase().includes(keyword)
    );
  }, [search]);

  const handleExport = () => {
    const header = "日志编号,操作类型,操作目标,操作人,IP,时间";
    const rows = filteredLogs.map((l) =>
      [l.id, l.op, l.target, l.operator, l.ip, l.time].map((v) => `"${v}"`).join(",")
    );
    const csv = [header, ...rows].join("\n");
    const BOM = "﻿";
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="操作审计"
        desc="所有敏感操作均记录至审计日志，支持检索与导出"
        actions={<Button variant="outline" size="sm" onClick={handleExport}>导出日志</Button>}
      />
      <Card className="p-4">
        <DataToolbar
          placeholder="操作人 / 操作类型 / 目标对象"
          onSearch={setSearch}
          onExport={handleExport}
        />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>日志编号</TableHead>
              <TableHead>操作类型</TableHead>
              <TableHead>操作目标</TableHead>
              <TableHead>操作人</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  无匹配日志
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-mono text-xs">{l.id}</TableCell>
                  <TableCell><Badge variant="outline">{l.op}</Badge></TableCell>
                  <TableCell>{l.target}</TableCell>
                  <TableCell>{l.operator}</TableCell>
                  <TableCell className="font-mono text-xs">{l.ip}</TableCell>
                  <TableCell className="text-muted-foreground">{l.time}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
