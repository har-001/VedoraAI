import 'package:flutter/material.dart';
import 'package:vedora_mobile/api/api_client.dart';
import 'package:vedora_mobile/screens/login_screen.dart';
import 'package:vedora_mobile/screens/stock_detail_screen.dart';
import 'package:vedora_mobile/screens/coach_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  List<dynamic> _gainers = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchOverview();
  }

  Future<void> _fetchOverview() async {
    setState(() => _loading = true);
    final gainersList = await api.getMarketOverview();
    setState(() {
      _gainers = gainersList;
      _loading = false;
    });
  }

  Future<void> _handleLogout() async {
    await api.logout();
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('VedoraAI Dashboard'),
        backgroundColor: theme.cardColor,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchOverview,
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _handleLogout,
          ),
        ],
      ),
      drawer: Drawer(
        child: Container(
          color: theme.scaffoldBackgroundColor,
          child: ListView(
            padding: EdgeInsets.zero,
            children: [
              DrawerHeader(
                decoration: BoxDecoration(color: theme.cardColor),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const CircleAvatar(
                      radius: 30,
                      backgroundColor: Color(0xFF6C5CE7),
                      child: Text('V', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
                    ),
                    const SizedBox(height: 12),
                    const Text('VedoraAI Platform', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const Text('Intelligence Behind Decisions', style: TextStyle(color: Colors.grey, fontSize: 12)),
                  ],
                ),
              ),
              ListTile(
                leading: const Icon(Icons.dashboard_outlined, color: Color(0xFF6C5CE7)),
                title: const Text('Overview'),
                onTap: () => Navigator.of(context).pop(),
              ),
              ListTile(
                leading: const Icon(Icons.psychology_outlined, color: Color(0xFF6C5CE7)),
                title: const Text('AI Coach Chat'),
                onTap: () {
                  Navigator.of(context).pop();
                  Navigator.of(context).push(MaterialPageRoute(builder: (_) => const CoachScreen()));
                },
              ),
              ListTile(
                leading: const Icon(Icons.info_outline, color: Colors.grey),
                title: const Text('About Platform'),
                onTap: () {
                  Navigator.of(context).pop();
                  showAboutDialog(
                    context: context,
                    applicationName: 'VedoraAI',
                    applicationVersion: '1.0.0',
                    applicationLegalese: 'AI-Powered Decision-Support Platform. For research purposes only.',
                  );
                },
              ),
            ],
          ),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _fetchOverview,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Market Indices Cards
                    Row(
                      children: [
                        Expanded(
                          child: _buildIndexCard(
                            'NIFTY 50',
                            '23,263.15',
                            '+114.70 (+0.50%)',
                            Colors.green,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildIndexCard(
                            'SENSEX',
                            '76,490.08',
                            '+402.16 (+0.53%)',
                            Colors.green,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Navigation Shortcuts
                    const Text(
                      'AI Intelligence Shortcuts',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _buildShortcutCard(
                            context,
                            'AI Coach',
                            'Ask Gemini expert questions',
                            Icons.psychology,
                            const Color(0xFF6C5CE7),
                            () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const CoachScreen())),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildShortcutCard(
                            context,
                            'Watchlist',
                            'Quick market alerts',
                            Icons.star_outline,
                            const Color(0xFF00D2FF),
                            () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Watchlist synced. Access stock details to add symbols.')),
                              );
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Top Market Performers
                    const Text(
                      'Top Performers (NSE)',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 12),

                    _gainers.isEmpty
                        ? Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(24),
                            decoration: BoxDecoration(
                              color: theme.cardColor,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Text(
                              'No market quotes loaded. Tap refresh above.',
                              textAlign: TextAlign.center,
                              style: TextStyle(color: Colors.grey),
                            ),
                          )
                        : ListView.separated(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: _gainers.length > 8 ? 8 : _gainers.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 8),
                            itemBuilder: (context, index) {
                              final item = _gainers[index];
                              final String symbol = item['symbol'] ?? 'STOCK';
                              final double price = (item['current_price'] ?? 0.0).toDouble();
                              final double chgPct = (item['change_percent'] ?? 0.0).toDouble();
                              final String name = item['name'] ?? symbol;

                              return Card(
                                color: theme.cardColor,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                margin: EdgeInsets.zero,
                                child: ListTile(
                                  onTap: () {
                                    Navigator.of(context).push(
                                      MaterialPageRoute(builder: (_) => StockDetailScreen(symbol: symbol)),
                                    );
                                  },
                                  title: Text(symbol, style: const TextStyle(fontWeight: FontWeight.bold)),
                                  subtitle: Text(name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                                  trailing: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text(
                                        '₹${price.toStringAsFixed(2)}',
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                      ),
                                      Text(
                                        '${chgPct >= 0 ? '+' : ''}${chgPct.toStringAsFixed(2)}%',
                                        style: TextStyle(
                                          color: chgPct >= 0 ? Colors.green : Colors.red,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildIndexCard(String title, String val, String chg, Color col) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF13173D),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white05),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(color: Colors.grey, fontSize: 12)),
          const SizedBox(height: 6),
          Text(val, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 2),
          Text(chg, style: TextStyle(color: col, fontSize: 11, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildShortcutCard(
    BuildContext context,
    String title,
    String sub,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF13173D),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white05),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 12),
            Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text(sub, style: const TextStyle(color: Colors.grey, fontSize: 11)),
          ],
        ),
      ),
    );
  }
}
