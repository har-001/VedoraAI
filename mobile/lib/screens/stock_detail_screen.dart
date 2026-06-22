import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:vedora_mobile/api/api_client.dart';

class StockDetailScreen extends StatefulWidget {
  final String symbol;

  const StockDetailScreen({Key? key, required this.symbol}) : super(key: key);

  @override
  State<StockDetailScreen> createState() => _StockDetailScreenState();
}

class _StockDetailScreenState extends State<StockDetailScreen> {
  Map<String, dynamic>? _detail;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchDetail();
  }

  Future<void> _fetchDetail() async {
    setState(() => _loading = true);
    final data = await api.getStockDetail(widget.symbol);
    setState(() {
      _detail = data;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    // Mock chart points if not returned from backend API
    final List<FlSpot> chartSpots = [
      const FlSpot(0, 100),
      const FlSpot(1, 102),
      const FlSpot(2, 98),
      const FlSpot(3, 105),
      const FlSpot(4, 104),
      const FlSpot(5, 112),
      const FlSpot(6, 110),
    ];

    final double currentPrice = _detail?['quote']?['current_price']?.toDouble() ?? 100.0;
    final double changePercent = _detail?['quote']?['change_percent']?.toDouble() ?? 0.0;
    final String name = _detail?['quote']?['name'] ?? widget.symbol;

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.symbol),
        backgroundColor: theme.cardColor,
        elevation: 0,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Price Header
                  Text(
                    name,
                    style: const TextStyle(fontSize: 16, color: Colors.grey),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Text(
                        '₹${currentPrice.toStringAsFixed(2)}',
                        style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        '${changePercent >= 0 ? '+' : ''}${changePercent.toStringAsFixed(2)}%',
                        style: TextStyle(
                          color: changePercent >= 0 ? Colors.green : Colors.red,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Chart Area using fl_chart
                  Container(
                    height: 200,
                    padding: const EdgeInsets.only(right: 16, top: 16),
                    decoration: BoxDecoration(
                      color: theme.cardColor,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: LineChart(
                      LineChartData(
                        gridData: const FlGridData(show: false),
                        titlesData: const FlTitlesData(show: false),
                        borderData: FlBorderData(show: false),
                        lineBarsData: [
                          LineChartBarData(
                            spots: chartSpots,
                            isCurved: true,
                            color: const Color(0xFF6C5CE7),
                            barWidth: 3,
                            dotData: const FlDotData(show: false),
                            belowBarData: BarAreaData(
                              show: true,
                              color: const Color(0x336C5CE7),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // AI Outlook Widget
                  const Text('AI Intelligence Outlook', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  _buildOutlookCard(theme),
                  const SizedBox(height: 24),

                  // Fundamentals Grid
                  const Text('Key Fundamentals', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  _buildFundamentalsGrid(theme),
                ],
              ),
            ),
    );
  }

  Widget _buildOutlookCard(ThemeData theme) {
    return Card(
      color: const Color(0xFF13173D),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.between,
              children: const [
                Text('AI Consensus Signal', style: TextStyle(color: Colors.grey)),
                Text('Bullish Outlook', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
              ],
            ),
            const Divider(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: const [
                Text('Signal Confidence', style: TextStyle(color: Colors.grey)),
                Text('84.2%', style: TextStyle(fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.between,
              children: const [
                Text('Prediction Horizon', style: TextStyle(color: Colors.grey)),
                Text('7-Day Trend', style: TextStyle(fontWeight: FontWeight.bold)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFundamentalsGrid(ThemeData theme) {
    final peRatio = _detail?['key_stats']?['pe_ratio'] ?? '28.4';
    final marketCap = _detail?['key_stats']?['market_cap'] ?? '₹12.4T';
    final open = _detail?['key_stats']?['open_price'] ?? '₹2,420';
    final volume = _detail?['key_stats']?['volume'] ?? '2.4M';

    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      childAspectRatio: 2.2,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      children: [
        _buildFundItem('P/E Ratio', peRatio.toString()),
        _buildFundItem('Market Cap', marketCap.toString()),
        _buildFundItem('Open Price', open.toString()),
        _buildFundItem('Daily Volume', volume.toString()),
      ],
    );
  }

  Widget _buildFundItem(String label, String value) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF13173D),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white05),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 11)),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
