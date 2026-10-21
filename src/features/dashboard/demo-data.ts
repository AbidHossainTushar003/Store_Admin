export type DashboardMetric = {
  label: string;
  value: string;
  note: string;
  icon: 'orders' | 'sales' | 'sellers' | 'products';
};

export const dashboardMetrics: DashboardMetric[] = [
  { label: 'Total orders', value: '1,284', note: 'SAMPLE COUNT · NOT LIVE', icon: 'orders' },
  { label: 'Gross sales', value: '৳ 1,248,600', note: 'SAMPLE BDT · NOT REAL REVENUE', icon: 'sales' },
  { label: 'Active sellers', value: '86', note: 'SAMPLE COUNT · NOT LIVE', icon: 'sellers' },
  { label: 'Products listed', value: '3,420', note: 'SAMPLE COUNT · NOT LIVE', icon: 'products' },
];

export const sampleOrderTrend = [
  { month: 'Jan', orders: 34 },
  { month: 'Feb', orders: 41 },
  { month: 'Mar', orders: 38 },
  { month: 'Apr', orders: 56 },
  { month: 'May', orders: 49 },
  { month: 'Jun', orders: 68 },
  { month: 'Jul', orders: 73 },
];

export type SampleOrder = {
  reference: string;
  buyer: string;
  seller: string;
  date: string;
  status: 'Sample processing' | 'Sample complete' | 'Demo only';
};

export const sampleRecentOrders: SampleOrder[] = [
  {
    reference: 'DEMO-ORD-1042',
    buyer: 'Sample Buyer A',
    seller: 'Example Seller Northstar',
    date: '21 Oct 2026',
    status: 'Sample processing',
  },
  {
    reference: 'DEMO-ORD-1037',
    buyer: 'Sample Buyer B',
    seller: 'Demo Studio Paperplane',
    date: '20 Oct 2026',
    status: 'Sample complete',
  },
  {
    reference: 'DEMO-ORD-1029',
    buyer: 'Sample Buyer C',
    seller: 'Example Seller Bluebird',
    date: '19 Oct 2026',
    status: 'Demo only',
  },
  {
    reference: 'DEMO-ORD-1018',
    buyer: 'Sample Buyer D',
    seller: 'Demo Studio Paperplane',
    date: '18 Oct 2026',
    status: 'Sample processing',
  },
];

export const sampleSellerActivity = [
  { text: 'Example Seller Northstar · sample listing activity', time: 'Sample event · 18 min ago' },
  { text: 'Demo Studio Paperplane · sample catalogue update', time: 'Sample event · 1 hr ago' },
  { text: 'Example Seller Bluebird · sample storefront activity', time: 'Sample event · 3 hrs ago' },
];

export const sampleMarketplaceSummary = {
  title: 'Marketplace snapshot',
  body: 'This panel illustrates where a future operational summary may appear. No live seller, product, order, or financial data is connected.',
  label: 'SAMPLE CONTENT',
};
