export interface CommerceRecord {
  id: string;
  date: string;
  product_category: string;
  revenue: number;
  units_sold: number;
  status: 'delivered' | 'canceled' | 'pending';
}

export const dummyCommerceData: CommerceRecord[] = [
  { id: "com-101", date: "2026-05-10", product_category: "Electronics", revenue: 1299.99, units_sold: 1, status: "delivered" },
  { id: "com-102", date: "2026-05-11", product_category: "Apparel", revenue: 89.50, units_sold: 2, status: "delivered" },
  { id: "com-103", date: "2026-05-11", product_category: "Home & Kitchen", revenue: 245.00, units_sold: 5, status: "pending" },
  { id: "com-104", date: "2026-05-12", product_category: "Fitness", revenue: 550.00, units_sold: 1, status: "delivered" },
  { id: "com-105", date: "2026-05-12", product_category: "Apparel", revenue: 45.00, units_sold: 1, status: "canceled" },
  { id: "com-106", date: "2026-05-13", product_category: "Electronics", revenue: 799.00, units_sold: 2, status: "delivered" },
  { id: "com-107", date: "2026-05-14", product_category: "Books", revenue: 54.20, units_sold: 3, status: "delivered" },
  { id: "com-108", date: "2026-05-15", product_category: "Home & Kitchen", revenue: 120.00, units_sold: 2, status: "delivered" },
  { id: "com-109", date: "2026-05-15", product_category: "Electronics", revenue: 1500.00, units_sold: 1, status: "pending" },
  { id: "com-110", date: "2026-05-16", product_category: "Beauty & Personal Care", revenue: 75.30, units_sold: 4, status: "delivered" },
  { id: "com-111", date: "2026-05-16", product_category: "Fitness", revenue: 180.00, units_sold: 2, status: "delivered" },
  { id: "com-112", date: "2026-05-17", product_category: "Books", revenue: 24.99, units_sold: 1, status: "delivered" },
  { id: "com-113", date: "2026-05-17", product_category: "Apparel", revenue: 320.00, units_sold: 8, status: "delivered" },
  { id: "com-114", date: "2026-05-18", product_category: "Home & Kitchen", revenue: 450.00, units_sold: 3, status: "delivered" },
  { id: "com-115", date: "2026-05-18", product_category: "Electronics", revenue: 299.99, units_sold: 1, status: "canceled" },
  { id: "com-116", date: "2026-05-19", product_category: "Beauty & Personal Care", revenue: 110.00, units_sold: 3, status: "delivered" },
  { id: "com-117", date: "2026-05-20", product_category: "Apparel", revenue: 150.00, units_sold: 3, status: "pending" },
  { id: "com-118", date: "2026-05-20", product_category: "Toys & Games", revenue: 65.00, units_sold: 2, status: "delivered" },
  { id: "com-119", date: "2026-05-21", product_category: "Books", revenue: 38.50, units_sold: 2, status: "delivered" },
  { id: "com-120", date: "2026-05-21", product_category: "Electronics", revenue: 450.00, units_sold: 1, status: "delivered" },
  { id: "com-121", date: "2026-05-22", product_category: "Fitness", revenue: 95.00, units_sold: 1, status: "delivered" },
  { id: "com-122", date: "2026-05-22", product_category: "Home & Kitchen", revenue: 35.00, units_sold: 1, status: "delivered" },
  { id: "com-123", date: "2026-05-23", product_category: "Apparel", revenue: 199.00, units_sold: 4, status: "delivered" },
  { id: "com-124", date: "2026-05-23", product_category: "Toys & Games", revenue: 120.00, units_sold: 6, status: "delivered" },
  { id: "com-125", date: "2026-05-24", product_category: "Beauty & Personal Care", revenue: 45.00, units_sold: 2, status: "canceled" },
  { id: "com-126", date: "2026-05-24", product_category: "Electronics", revenue: 2100.00, units_sold: 3, status: "delivered" },
  { id: "com-127", date: "2026-05-25", product_category: "Books", revenue: 112.00, units_sold: 5, status: "delivered" },
  { id: "com-128", date: "2026-05-25", product_category: "Home & Kitchen", revenue: 620.00, units_sold: 4, status: "delivered" },
  { id: "com-129", date: "2026-05-26", product_category: "Fitness", revenue: 1200.00, units_sold: 2, status: "pending" },
  { id: "com-130", date: "2026-05-26", product_category: "Toys & Games", revenue: 85.00, units_sold: 3, status: "delivered" },
  { id: "com-131", date: "2026-05-27", product_category: "Apparel", revenue: 75.00, units_sold: 1, status: "delivered" },
  { id: "com-132", date: "2026-05-27", product_category: "Electronics", revenue: 180.00, units_sold: 2, status: "delivered" },
  { id: "com-133", date: "2026-05-28", product_category: "Beauty & Personal Care", revenue: 95.00, units_sold: 3, status: "delivered" },
  { id: "com-134", date: "2026-05-28", product_category: "Home & Kitchen", revenue: 150.00, units_sold: 1, status: "delivered" },
  { id: "com-135", date: "2026-05-01", product_category: "Electronics", revenue: 599.99, units_sold: 1, status: "delivered" },
  { id: "com-136", date: "2026-05-02", product_category: "Apparel", revenue: 120.00, units_sold: 3, status: "delivered" },
  { id: "com-137", date: "2026-05-02", product_category: "Home & Kitchen", revenue: 89.90, units_sold: 1, status: "canceled" },
  { id: "com-138", date: "2026-05-03", product_category: "Fitness", revenue: 220.00, units_sold: 2, status: "delivered" },
  { id: "com-139", date: "2026-05-04", product_category: "Books", revenue: 15.00, units_sold: 1, status: "delivered" },
  { id: "com-140", date: "2026-05-04", product_category: "Beauty & Personal Care", revenue: 60.00, units_sold: 2, status: "pending" },
  { id: "com-141", date: "2026-05-05", product_category: "Toys & Games", revenue: 45.00, units_sold: 1, status: "delivered" },
  { id: "com-142", date: "2026-05-05", product_category: "Electronics", revenue: 350.00, units_sold: 1, status: "delivered" },
  { id: "com-143", date: "2026-05-06", product_category: "Apparel", revenue: 310.00, units_sold: 6, status: "delivered" },
  { id: "com-144", date: "2026-05-07", product_category: "Home & Kitchen", revenue: 175.00, units_sold: 2, status: "delivered" },
  { id: "com-145", date: "2026-05-07", product_category: "Fitness", revenue: 75.00, units_sold: 1, status: "delivered" },
  { id: "com-146", date: "2026-05-08", product_category: "Books", revenue: 42.00, units_sold: 2, status: "delivered" },
  { id: "com-147", date: "2026-05-08", product_category: "Beauty & Personal Care", revenue: 125.00, units_sold: 5, status: "delivered" },
  { id: "com-148", date: "2026-05-09", product_category: "Toys & Games", revenue: 110.00, units_sold: 4, status: "delivered" },
  { id: "com-149", date: "2026-05-09", product_category: "Electronics", revenue: 899.99, units_sold: 1, status: "pending" },
  { id: "com-150", date: "2026-05-10", product_category: "Apparel", revenue: 55.00, units_sold: 1, status: "delivered" }
];
