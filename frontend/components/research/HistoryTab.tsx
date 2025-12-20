import React, { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Tooltip } from "@heroui/tooltip";
import { Badge } from "@heroui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  TrendingUp,
  BookText,
  FileText,
  Trash2,
  Clock,
  RefreshCw,
} from "lucide-react";
import { useHistoryStore, HistoryItem } from "@/lib/historyStore";

interface HistoryTabProps {
  onItemLoad: (item: HistoryItem) => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ onItemLoad }) => {
  const { historyItems, loading, loadAllHistory, deleteHistoryItem } =
    useHistoryStore();
  const [activeFilter, setActiveFilter] = useState<string>("search");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    loadAllHistory();
  }, [loadAllHistory]);

  const getTypeCounts = () => {
    return historyItems.reduce(
      (acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  };

  const typeCounts = getTypeCounts();

  const filteredItems = historyItems.filter((item) => {
    return item.type === activeFilter;
  });

  const handleDelete = async (id: number, type: string) => {
    const success = await deleteHistoryItem(id, type);
    if (success) {
      setDeleteConfirm(null);
    }
  };

  const handleRefresh = () => {
    loadAllHistory();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return "Just now";
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "search":
        return Search;
      case "analysis":
        return TrendingUp;
      case "citation":
        return BookText;
      case "review":
        return FileText;
      default:
        return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "search":
        return "primary";
      case "analysis":
        return "success";
      case "citation":
        return "secondary";
      case "review":
        return "warning";
      default:
        return "default";
    }
  };

  const filterButtons = [
    { key: "search", label: "Searches", count: typeCounts.search || 0 },
    { key: "analysis", label: "Analyses", count: typeCounts.analysis || 0 },
    { key: "citation", label: "Citations", count: typeCounts.citation || 0 },
    { key: "review", label: "Reviews", count: typeCounts.review || 0 },
  ];

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-center items-center py-12"
      >
        <Spinner size="lg" color="primary" />
        <p className="mt-4 text-default-500">Loading your history...</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 mt-20"
    >
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-default-50 to-primary-50 border-none shadow-medium">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-2 md:p-3 bg-primary-100 rounded-xl flex-shrink-0">
                <Clock className="w-5 h-5 md:w-7 md:h-7 text-primary-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-default-900">
                  Research History
                </h1>
                <p className="text-sm md:text-base text-default-600 mt-1">
                  Browse and restore your previous work
                </p>
              </div>
            </div>

            <div className="flex gap-3 w-full md:w-auto justify-end">
              {/* Refresh Button */}
              <Tooltip content="Refresh history">
                <Button
                  isIconOnly
                  variant="bordered"
                  size="sm"
                  onPress={handleRefresh}
                  className="flex-shrink-0"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </Tooltip>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filter ButtonGroup */}
      <Card className="border-1 border-default-200">
        <CardBody className="p-3 md:p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
            <div className="w-full sm:w-auto overflow-x-auto">
              <div className="flex gap-2 min-w-min">
                {filterButtons.map((button) => (
                  <Button
                    key={button.key}
                    color={activeFilter === button.key ? "primary" : "default"}
                    variant={activeFilter === button.key ? "solid" : "flat"}
                    onPress={() => setActiveFilter(button.key)}
                    className="font-medium text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4"
                    size="sm"
                  >
                    {button.label}
                    {button.count > 0 && (
                      <Chip
                        size="sm"
                        variant="flat"
                        color={
                          activeFilter === button.key ? "default" : "primary"
                        }
                        className="ml-1 sm:ml-2 text-xs"
                      >
                        {button.count}
                      </Chip>
                    )}
                  </Button>
                ))}
              </div>
            </div>

            <Chip
              size="sm"
              variant="flat"
              color="default"
              className="self-end sm:self-auto whitespace-nowrap"
            >
              Showing {filteredItems.length} items
            </Chip>
          </div>
        </CardBody>
      </Card>

      {/* History Items */}
      <AnimatePresence mode="wait">
        {filteredItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center py-16"
          >
            <Card className="max-w-md mx-auto border-dashed border-2 border-default-200">
              <CardBody className="py-12">
                <div className="bg-default-100 rounded-full p-8 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Clock className="w-12 h-12 text-default-400" />
                </div>
                <h3 className="text-xl font-semibold text-default-900 mb-3">
                  No{" "}
                  {activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}{" "}
                  History
                </h3>
                <p className="text-default-600">
                  Your {activeFilter} activities will appear here
                </p>
              </CardBody>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid gap-4"
          >
            {filteredItems.map((item, index) => {
              const TypeIcon = getTypeIcon(item.type);
              const typeColor = getTypeColor(item.type);

              return (
                <motion.div
                  key={`${item.type}-${item.id}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-lg hover:scale-[1.01] transition-all duration-200 group border-1 border-default-200">
                    <CardBody className="p-4 md:p-6">
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div className="flex-1 min-w-0 w-full">
                          {/* Header with Icon, Type, and Date */}
                          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                            <Badge
                              content=""
                              color={typeColor as any}
                              shape="circle"
                              placement="bottom-right"
                              size="sm"
                            >
                              <div className="p-2 md:p-3 bg-default-100 rounded-xl group-hover:bg-default-200 transition-colors flex-shrink-0">
                                <TypeIcon
                                  className={`w-5 h-5 md:w-6 md:h-6 ${
                                    typeColor === "primary"
                                      ? "text-primary-600"
                                      : typeColor === "success"
                                        ? "text-success-600"
                                        : typeColor === "secondary"
                                          ? "text-secondary-600"
                                          : typeColor === "warning"
                                            ? "text-warning-600"
                                            : "text-default-600"
                                  }`}
                                />
                              </div>
                            </Badge>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <Chip
                                  color={typeColor as any}
                                  variant="flat"
                                  size="sm"
                                  className="font-medium text-xs"
                                >
                                  {item.type.charAt(0).toUpperCase() +
                                    item.type.slice(1)}
                                </Chip>
                                <Chip
                                  variant="bordered"
                                  size="sm"
                                  startContent={<Clock className="w-3 h-3" />}
                                  className="text-xs"
                                >
                                  {formatDate(item.created_at)}
                                </Chip>
                              </div>
                            </div>
                          </div>

                          {/* Title and Subtitle */}
                          <div className="space-y-2 mb-3 md:mb-4">
                            <h3 className="font-semibold text-default-900 text-base md:text-lg group-hover:text-primary-600 transition-colors break-words">
                              {item.title}
                            </h3>
                            {item.subtitle && (
                              <p className="text-default-600 text-xs md:text-sm line-clamp-2 break-words">
                                {item.subtitle}
                              </p>
                            )}
                          </div>

                          {/* Additional Info Based on Type */}
                          {item.type === "search" && item.data.filters && (
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(item.data.filters)
                                .map(([key, value]) => {
                                  if (value && value !== "all") {
                                    return (
                                      <Chip
                                        key={key}
                                        size="sm"
                                        variant="bordered"
                                        className="text-xs"
                                      >
                                        {key}: {String(value)}
                                      </Chip>
                                    );
                                  }
                                  return null;
                                })
                                .filter(Boolean)}
                            </div>
                          )}

                          {item.type === "analysis" && (
                            <div className="flex flex-wrap gap-1">
                              <Chip
                                size="sm"
                                variant="dot"
                                color={typeColor as any}
                              >
                                {item.data.type === "trend"
                                  ? "Trend Analysis"
                                  : "Citation Analysis"}
                              </Chip>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex sm:flex-col gap-2 w-full sm:w-auto sm:ml-4 flex-shrink-0">
                          <Tooltip content={`Load this ${item.type}`}>
                            <Button
                              color="primary"
                              variant="solid"
                              size="sm"
                              onPress={() => onItemLoad(item)}
                              className="flex-1 sm:flex-initial sm:min-w-20 font-medium"
                            >
                              Load
                            </Button>
                          </Tooltip>

                          <AnimatePresence mode="wait">
                            {deleteConfirm === item.id ? (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="flex gap-2 sm:flex-col sm:gap-1 flex-1 sm:flex-initial"
                              >
                                <Button
                                  color="danger"
                                  variant="solid"
                                  size="sm"
                                  onPress={() =>
                                    handleDelete(item.id, item.type)
                                  }
                                  className="flex-1 sm:flex-initial sm:min-w-20"
                                >
                                  Confirm
                                </Button>
                                <Button
                                  color="default"
                                  variant="bordered"
                                  size="sm"
                                  onPress={() => setDeleteConfirm(null)}
                                  className="flex-1 sm:flex-initial sm:min-w-20"
                                >
                                  Cancel
                                </Button>
                              </motion.div>
                            ) : (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="flex-1 sm:flex-initial"
                              >
                                <Tooltip content="Delete this item">
                                  <Button
                                    color="danger"
                                    variant="light"
                                    size="sm"
                                    onPress={() => setDeleteConfirm(item.id)}
                                    startContent={
                                      <Trash2 className="w-4 h-4" />
                                    }
                                    className="w-full sm:w-auto sm:min-w-20"
                                  >
                                    Delete
                                  </Button>
                                </Tooltip>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats and Summary Footer */}
      {historyItems.length > 0 && (
        <Card className="border-1 border-default-200">
          <CardBody className="py-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex flex-wrap gap-2">
                {Object.entries(typeCounts).map(([type, count]) => (
                  <Chip
                    key={type}
                    size="sm"
                    variant="dot"
                    color={getTypeColor(type) as any}
                    className="capitalize"
                  >
                    {count} {type}
                    {count > 1 ? "s" : ""}
                  </Chip>
                ))}
              </div>

              <Button
                size="sm"
                variant="light"
                startContent={<RefreshCw className="w-4 h-4" />}
                onPress={handleRefresh}
                className="flex-shrink-0 w-full sm:w-auto"
              >
                Refresh
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </motion.div>
  );
};
