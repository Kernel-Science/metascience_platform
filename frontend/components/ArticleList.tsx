"use client";
import React from "react";
import { Listbox, ListboxItem } from "@heroui/listbox";

import { Article } from "@/types";

interface ArticleListProps {
  articles: Article[];
  onArticleSelect: (article: Article) => void;
  selectedArticle: Article | null;
}

const ArticleList: React.FC<ArticleListProps> = ({
  articles,
  onArticleSelect,
  selectedArticle,
}) => {
  if (articles.length === 0) {
    return <p>No articles to display.</p>;
  }

  return (
    <Listbox
      aria-label="List of articles in the network"
      selectedKeys={selectedArticle ? [selectedArticle.id] : []}
      selectionMode="single"
      onAction={(key) => onArticleSelect(articles.find((a) => a.id === key)!)}
    >
      {articles.map((article) => (
        <ListboxItem key={article.id} textValue={article.title}>
          <div>
            <p className="font-bold">{article.title}</p>
            <p className="text-sm text-gray-500">
              {article.authors?.map((a: any) => a.name).join(", ")} (
              {article.year})
            </p>
          </div>
        </ListboxItem>
      ))}
    </Listbox>
  );
};

export default ArticleList;
