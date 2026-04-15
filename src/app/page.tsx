"use client";

import { AppHeader } from "@/components/app/app-header";
import { ContentCard } from "@/components/app/content-card";
import { PageLoading } from "@/components/app/page-loading";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorNotice } from "@/components/ui/error-notice";
import { useCurrentUser } from "@/hooks/use-current-user";

const contentItems = [
  {
    title: "在城市边缘写下第一条分支",
    excerpt: "一段笔记从清晨开始，沿着河岸、站台和未完成的句子慢慢展开。",
    author: "歧路编辑部",
    tag: "路径",
    height: "tall" as const,
    image:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "节点之间",
    excerpt: "每一次选择都留下坐标。内容流先记录方向，再等待新的枝节生长。",
    author: "marmot",
    tag: "节点",
    height: "medium" as const,
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "夜色中的草稿",
    excerpt: "没有完成的段落不必急着抵达，它们可以先停在分岔口。",
    author: "Qi Lu",
    tag: "草稿",
    height: "short" as const,
    image:
      "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "分支不是迷路",
    excerpt: "当内容以双列流动，选择的关系会比单一路线更清楚。",
    author: "路径观察",
    tag: "推荐",
    height: "medium" as const,
    image:
      "https://images.unsplash.com/photo-1473773508845-188df298d2d1?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "留白处的方向感",
    excerpt: "克制的界面应该让内容先说话，线条只负责暗示连接。",
    author: "歧路设计",
    tag: "设计",
    height: "tall" as const,
    image:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "下一次抵达之前",
    excerpt: "主页暂时展示推荐流，后续内容接口接入时保留相同的信息结构。",
    author: "系统",
    tag: "MVP",
    height: "short" as const,
    image:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80",
  },
];

export default function Home() {
  const { user, error, isLoading } = useCurrentUser();

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <AppHeader />

      <div className="mx-auto grid max-w-7xl gap-7 px-5 py-7 sm:px-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0">
          <div className="mb-7 rounded-md border border-line bg-panel p-6 shadow-subtle sm:p-8">
            <div className="relative pl-8">
              <div className="absolute left-0 top-1 h-full w-px bg-line" />
              <div className="absolute left-0 top-7 h-px w-16 bg-line" />
              <div className="absolute -left-1 top-6 h-2.5 w-2.5 rounded-full bg-accent" />
              <p className="text-sm tracking-[0.24em] text-muted">HOME</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                欢迎回来，{user?.nickname}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">
                内容先以推荐流的形态生长。每张卡片是一枚节点，沿着不同方向延展，但仍归于同一条产品路径。
              </p>
            </div>
          </div>

          <div className="columns-1 gap-5 sm:columns-2 xl:columns-3 [&>*]:mb-5">
            {contentItems.map((item) => (
              <ContentCard key={item.title} {...item} />
            ))}
          </div>
        </section>

        <aside className="space-y-5">
          {error ? <ErrorNotice message={error} /> : null}

          <Card>
            <CardHeader eyebrow="个人节点" title="当前用户" />
            <CardContent className="space-y-4">
              <div className="rounded-md border border-line bg-soft p-4">
                <p className="text-xs text-muted">昵称</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {user?.nickname}
                </p>
              </div>
              <div className="rounded-md border border-line bg-soft p-4">
                <p className="text-xs text-muted">邮箱</p>
                <p className="mt-1 break-all text-sm font-medium text-foreground">
                  {user?.email}
                </p>
              </div>
            </CardContent>
          </Card>

          <EmptyState
            title="内容接口待接入"
            description="当前推荐流为前端 MVP 占位，不新增后端接口。后续只需替换数据来源，保留同一套卡片结构。"
          />
        </aside>
      </div>
    </main>
  );
}
