import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:vedora_mobile/api/api_client.dart';
import 'package:vedora_mobile/screens/login_screen.dart';
import 'package:vedora_mobile/screens/dashboard_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();
  final hasToken = prefs.getString('access_token') != null;

  runApp(VedoraApp(isLoggedIn: hasToken));
}

class VedoraApp extends StatelessWidget {
  final bool isLoggedIn;

  const VedoraApp({Key? key, required this.isLoggedIn}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'VedoraAI',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: const Color(0xFF6C5CE7),
        scaffoldBackgroundColor: const Color(0xFF0C0F24),
        cardColor: const Color(0xFF13173D),
        dividerColor: Colors.white10,
        textTheme: GoogleFonts.outfitTextTheme(ThemeData.dark().textTheme).copyWith(
          titleLarge: GoogleFonts.outfit(
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
          bodyMedium: GoogleFonts.outfit(
            fontSize: 14,
            color: const Color(0xFFB0B3C7),
          ),
        ),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF6C5CE7),
          secondary: Color(0xFF00D2FF),
          surface: Color(0xFF13173D),
          background: const Color(0xFF0C0F24),
        ),
      ),
      home: isLoggedIn ? const DashboardScreen() : const LoginScreen(),
    );
  }
}
