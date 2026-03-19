import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:math' as math;
import 'dart:ui';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'core/config/app_config.dart';
import 'home_page.dart';
import 'pending_scan_page.dart';
import 'profile_page.dart';
import 'search_page.dart';

void main() {
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );
  runApp(const PassportScannerApp());
}

// ─────────────────────────────────────────────────────────────────────────────
// PALETTE
// ─────────────────────────────────────────────────────────────────────────────
class TW {
  static const cream = Color(0xFFFFFDF1);
  static const peach = Color(0xFFFFCE99);
  static const amber = Color(0xFFFF9644);
  static const brown = Color(0xFF562F00);
  static const amberDk = Color(0xFFFF7A1A);
  static const white70 = Color(0xB3FFFFFF);
  static const white90 = Color(0xE6FFFFFF);
  static const navy = Color(0xFF161E54);
  static const navyLt = Color(0xFF1E2A6E);
  static const sky = Color(0xFFBBE0EF);
}

// ─────────────────────────────────────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────────────────────────────────────
class PassportScannerApp extends StatelessWidget {
  const PassportScannerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ScreenUtilInit(
      designSize: const Size(375, 812), // Standard iPhone X design size
      minTextAdapt: true,
      splitScreenMode: true,
      builder: (_, child) {
        return MaterialApp(
          title: 'TradeWings',
          debugShowCheckedModeBanner: false,
          theme: ThemeData(
            scaffoldBackgroundColor: TW.cream,
            useMaterial3: true,
            textTheme: GoogleFonts.outfitTextTheme(),
          ),
          home: const LoginPage(),
        );
      },
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUND PAINTER  — layered mesh + scanline + orbit
// ─────────────────────────────────────────────────────────────────────────────
class BgPainter extends CustomPainter {
  final double t; // 0..1 looping

  BgPainter(this.t);

  @override
  void paint(Canvas canvas, Size s) {
    _orb(
      canvas,
      s,
      Offset(s.width * 0.88, s.height * 0.18),
      s.width * 0.55,
      TW.peach.withOpacity(0.45),
    );
    _orb(
      canvas,
      s,
      Offset(s.width * 0.08, s.height * 0.72),
      s.width * 0.50,
      TW.navy.withOpacity(0.25),
    );
    _orb(
      canvas,
      s,
      Offset(s.width * 0.15, s.height * 0.15),
      s.width * 0.35,
      TW.navyLt.withOpacity(0.15),
    );
    _orb(
      canvas,
      s,
      Offset(s.width * 0.5, s.height * 0.45),
      s.width * 0.70,
      TW.peach.withOpacity(0.10),
    );

    // dot matrix
    final dp = Paint()
      ..color = TW.brown.withOpacity(0.055)
      ..style = PaintingStyle.fill;
    for (double x = 14; x < s.width; x += 24) {
      for (double y = 14; y < s.height; y += 24) {
        canvas.drawCircle(Offset(x, y), 1.15, dp);
      }
    }

    // arc rings — top right corner
    final rp = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.1;
    for (int i = 0; i < 5; i++) {
      final r = s.width * (0.18 + i * 0.10);
      rp.color = TW.amber.withOpacity(0.07 + i * 0.015);
      canvas.drawArc(
        Rect.fromCircle(
          center: Offset(s.width * 1.05, -s.height * 0.04),
          radius: r,
        ),
        math.pi * 0.58,
        math.pi * 0.46,
        false,
        rp,
      );
    }

    // horizontal scanline sweep
    final lineY = s.height * ((t * 1.4 - 0.2).clamp(0.0, 1.0));
    final scanP = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          TW.amber.withOpacity(0.0),
          TW.amber.withOpacity(0.07),
          TW.amber.withOpacity(0.0),
        ],
        stops: const [0.0, 0.5, 1.0],
      ).createShader(Rect.fromLTWH(0, lineY - 60, s.width, 120));
    canvas.drawRect(Rect.fromLTWH(0, lineY - 60, s.width, 120), scanP);

    // orbit dots
    final op = Paint()..style = PaintingStyle.fill;
    final cx = s.width * 0.5;
    final cy = s.height * 0.38;
    for (int i = 0; i < 10; i++) {
      final angle = (i / 10) * 2 * math.pi + t * 2 * math.pi;
      final rx = cx + math.cos(angle) * s.width * 0.44;
      final ry = cy + math.sin(angle) * s.height * 0.38;
      final scale = (math.sin(angle + math.pi / 2) + 1) / 2;
      op.color = TW.amber.withOpacity(0.12 + scale * 0.10);
      canvas.drawCircle(Offset(rx, ry), 2.0 + scale * 1.5, op);
    }
  }

  void _orb(Canvas c, Size s, Offset center, double radius, Color color) {
    c.drawCircle(
      center,
      radius,
      Paint()
        ..shader = RadialGradient(
          colors: [color, color.withOpacity(0.0)],
        ).createShader(Rect.fromCircle(center: center, radius: radius)),
    );
  }

  @override
  bool shouldRepaint(BgPainter old) => old.t != t;
}

// ─────────────────────────────────────────────────────────────────────────────
// PASSPORT STAMP LOGO PAINTER
// ─────────────────────────────────────────────────────────────────────────────
class StampPainter extends CustomPainter {
  final double glowPulse; // 0..1

  StampPainter(this.glowPulse);

  @override
  void paint(Canvas canvas, Size s) {
    final cx = s.width / 2, cy = s.height / 2, r = s.width / 2 - 3;

    // Outer glow
    canvas.drawCircle(
      Offset(cx, cy),
      r + 6 + glowPulse * 4,
      Paint()
        ..color = TW.amber.withOpacity(0.12 + glowPulse * 0.08)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 14),
    );

    // Fill
    canvas.drawCircle(
      Offset(cx, cy),
      r,
      Paint()
        ..shader = RadialGradient(
          colors: [TW.cream, TW.peach.withOpacity(0.35)],
        ).createShader(Rect.fromCircle(center: Offset(cx, cy), radius: r)),
    );

    // Double ring
    final stroke = Paint()
      ..color = TW.brown
      ..style = PaintingStyle.stroke;
    canvas.drawCircle(Offset(cx, cy), r, stroke..strokeWidth = 2.5);
    canvas.drawCircle(Offset(cx, cy), r - 8, stroke..strokeWidth = 1.0);

    // Wings — left
    final wp = Paint()
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    void wing(bool left) {
      final m = left ? -1.0 : 1.0;
      for (int f = 0; f < 3; f++) {
        final fw = 0.22 + f * 0.12;
        final fh = 0.18 + f * 0.10;
        final path = Path()
          ..moveTo(cx + m * r * 0.18, cy + r * 0.08)
          ..cubicTo(
            cx + m * r * fw,
            cy - r * fh,
            cx + m * r * (fw + 0.32),
            cy - r * (fh - 0.12),
            cx + m * r * (fw + 0.28),
            cy + r * 0.22,
          );
        wp
          ..color = TW.amber.withOpacity(0.9 - f * 0.22)
          ..strokeWidth = 2.4 - f * 0.6;
        canvas.drawPath(path, wp);
      }
    }

    wing(true);
    wing(false);

    // Globe — centre
    final gp = Paint()
      ..color = TW.brown.withOpacity(0.85)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.4;
    final gr = r * 0.26;
    canvas.drawCircle(Offset(cx, cy), gr, gp);
    canvas.drawOval(
      Rect.fromCenter(center: Offset(cx, cy), width: gr * 2, height: gr * 1.0),
      gp..strokeWidth = 1.0,
    );
    canvas.drawLine(Offset(cx, cy - gr), Offset(cx, cy + gr), gp);
    canvas.drawLine(Offset(cx - gr, cy), Offset(cx + gr, cy), gp);

    // Dashes on inner ring
    final dashP = Paint()
      ..color = TW.brown.withOpacity(0.3)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;
    const dashes = 24;
    for (int i = 0; i < dashes; i++) {
      final a = (i / dashes) * 2 * math.pi;
      final r1 = r - 8;
      final r2 = r1 - 5;
      if (i % 2 == 0) {
        canvas.drawLine(
          Offset(cx + math.cos(a) * r1, cy + math.sin(a) * r1),
          Offset(cx + math.cos(a) * r2, cy + math.sin(a) * r2),
          dashP,
        );
      }
    }
  }

  @override
  bool shouldRepaint(StampPainter old) => old.glowPulse != glowPulse;
}

// ─────────────────────────────────────────────────────────────────────────────
// MRZ STRIP — decorative passport machine-readable zone
// ─────────────────────────────────────────────────────────────────────────────
class MrzStrip extends StatelessWidget {
  const MrzStrip({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 14),
      decoration: BoxDecoration(
        color: TW.brown.withOpacity(0.04),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: TW.brown.withOpacity(0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _mrzRow('P<PHL<TOURS<R<US<<PASSPORT<SCANNER<<<<<<<<<<'),
          const SizedBox(height: 3),
          _mrzRow('TW00000001PHL8901015M3001019<<<<<<<<<<<<<<06'),
        ],
      ),
    );
  }

  Widget _mrzRow(String text) => Text(
    text,
    style: GoogleFonts.sourceCodePro(
      fontSize: 9.5,
      letterSpacing: 1.6,
      color: TW.brown.withOpacity(0.28),
      fontWeight: FontWeight.w500,
    ),
    overflow: TextOverflow.ellipsis,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ELEVATED TEXT FIELD
// ─────────────────────────────────────────────────────────────────────────────
class TWTextField extends StatefulWidget {
  final String label;
  final String hint;
  final IconData icon;
  final bool obscure;
  final TextEditingController controller;
  final TextInputType keyboardType;
  final ValueChanged<String>? onChanged;

  const TWTextField({
    super.key,
    required this.label,
    required this.hint,
    required this.icon,
    required this.controller,
    this.obscure = false,
    this.keyboardType = TextInputType.text,
    this.onChanged,
  });

  @override
  State<TWTextField> createState() => _TWTextFieldState();
}

class _TWTextFieldState extends State<TWTextField>
    with SingleTickerProviderStateMixin {
  bool _focused = false;
  bool _visible = false;
  late AnimationController _ac;
  late Animation<double> _glow;

  @override
  void initState() {
    super.initState();
    _ac = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 280),
    );
    _glow = CurvedAnimation(parent: _ac, curve: Curves.easeOut);
  }

  @override
  void dispose() {
    _ac.dispose();
    super.dispose();
  }

  void _focus(bool v) {
    setState(() => _focused = v);
    v ? _ac.forward() : _ac.reverse();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Floating label
        AnimatedDefaultTextStyle(
          duration: const Duration(milliseconds: 220),
          style: GoogleFonts.outfit(
            fontSize: 10.5.sp,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.8.w,
            color: _focused ? TW.amber : TW.brown.withOpacity(0.45),
          ),
          child: Text(widget.label.toUpperCase()),
        ),
        SizedBox(height: 8.h),
        AnimatedBuilder(
          animation: _glow,
          builder: (_, child) => Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14.r),
              boxShadow: [
                BoxShadow(
                  color: TW.amber.withOpacity(0.22 * _glow.value),
                  blurRadius: 18.r,
                  spreadRadius: 0,
                ),
              ],
            ),
            child: child,
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(14.r),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 6, sigmaY: 6),
              child: Focus(
                onFocusChange: _focus,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  decoration: BoxDecoration(
                    color: _focused
                        ? Colors.white.withOpacity(0.92)
                        : Colors.white.withOpacity(0.62),
                    borderRadius: BorderRadius.circular(14.r),
                    border: Border.all(
                      color: _focused ? TW.amber : TW.peach.withOpacity(0.6),
                      width: _focused ? 1.8.w : 1.2.w,
                    ),
                  ),
                  child: TextField(
                    controller: widget.controller,
                    obscureText: widget.obscure && !_visible,
                    keyboardType: widget.keyboardType,
                    onChanged: widget.onChanged,
                    style: GoogleFonts.outfit(
                      fontSize: 15.5.sp,
                      fontWeight: FontWeight.w500,
                      color: TW.brown,
                    ),
                    decoration: InputDecoration(
                      hintText: widget.hint,
                      hintStyle: GoogleFonts.outfit(
                        fontSize: 14.5.sp,
                        fontWeight: FontWeight.w400,
                        color: TW.brown.withOpacity(0.28),
                      ),
                      prefixIcon: AnimatedContainer(
                        duration: const Duration(milliseconds: 220),
                        padding: EdgeInsets.only(left: 16.w, right: 10.w),
                        child: Icon(
                          widget.icon,
                          size: 19.sp,
                          color: _focused
                              ? TW.amber
                              : TW.brown.withOpacity(0.38),
                        ),
                      ),
                      suffixIcon: widget.obscure
                          ? GestureDetector(
                              onTap: () => setState(() => _visible = !_visible),
                              child: Icon(
                                _visible
                                    ? Icons.visibility_rounded
                                    : Icons.visibility_off_rounded,
                                size: 19.sp,
                                color: TW.brown.withOpacity(0.38),
                              ),
                            )
                          : null,
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.symmetric(
                        horizontal: 6.w,
                        vertical: 16.h,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SHIMMER BUTTON
// ─────────────────────────────────────────────────────────────────────────────
class ShimmerButton extends StatefulWidget {
  final bool isLoading;
  final VoidCallback? onTap;

  const ShimmerButton({super.key, required this.isLoading, this.onTap});

  @override
  State<ShimmerButton> createState() => _ShimmerButtonState();
}

class _ShimmerButtonState extends State<ShimmerButton> {
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.isLoading ? null : widget.onTap,
      child:
          Container(
                width: double.infinity,
                height: 58.h,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16.r),
                  color: const Color(0xFFFF9644),
                  boxShadow: [
                    BoxShadow(
                      color: TW.amber.withOpacity(0.38),
                      blurRadius: 24.r,
                      spreadRadius: 0,
                      offset: Offset(0, 8.h),
                    ),
                    BoxShadow(
                      color: TW.amberDk.withOpacity(0.15),
                      blurRadius: 6.r,
                      offset: Offset(0, 2.h),
                    ),
                  ],
                ),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    // Gloss overlay
                    Positioned(
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 28.h,
                      child: Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.vertical(
                            top: Radius.circular(16.r),
                          ),
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.white.withOpacity(0.18),
                              Colors.white.withOpacity(0.0),
                            ],
                          ),
                        ),
                      ),
                    ),
                    widget.isLoading
                        ? SizedBox(
                            width: 22.w,
                            height: 22.w,
                            child: const CircularProgressIndicator(
                              strokeWidth: 2.2,
                              valueColor: AlwaysStoppedAnimation(
                                Color(0xFFFFFDF1),
                              ),
                            ),
                          )
                        : Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                'SIGN IN',
                                style: GoogleFonts.outfit(
                                  fontSize: 14.sp,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 3.2.w,
                                  color: Colors.white,
                                ),
                              ),
                              SizedBox(width: 12.w),
                              Container(
                                width: 28.w,
                                height: 28.w,
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.22),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  Icons.arrow_forward_rounded,
                                  color: Colors.white,
                                  size: 15.sp,
                                ),
                              ),
                            ],
                          ),
                  ],
                ),
              )
              .animate(onPlay: (c) => c.repeat())
              .shimmer(
                duration: 2.seconds,
                color: const Color(0xFFFFB570).withOpacity(0.3),
                angle: 0.785, // 45 degrees
              ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN LOGIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage>
    with SingleTickerProviderStateMixin {
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();

  late AnimationController _bgCtrl; // background loop

  bool _isLoading = false;

  @override
  void initState() {
    super.initState();

    _bgCtrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 22),
    )..repeat();
  }

  @override
  void dispose() {
    _bgCtrl.dispose();
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (_emailCtrl.text.isEmpty || _passCtrl.text.isEmpty) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter both email and password'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final response = await http.post(
        Uri.parse(AppConfig.loginUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': _emailCtrl.text.trim(),
          'password': _passCtrl.text,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        if (!mounted) return;
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => OfficerHomeShell(
              user: data['user'],
              authToken: (data['token'] ?? '').toString(),
            ),
          ),
        );
      } else {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(data['error'] ?? 'Login failed'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Connection Error: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool compact = 1.sh < 700;

    return Scaffold(
      backgroundColor: TW.cream,
      resizeToAvoidBottomInset: true,
      body: Stack(
        children: [
          // ── Animated BG ────────────────────────────────────────────────
          AnimatedBuilder(
            animation: _bgCtrl,
            builder: (_, __) => CustomPaint(
              size: Size(1.sw, 1.sh),
              painter: BgPainter(_bgCtrl.value),
            ),
          ),

          // ── Content ────────────────────────────────────────────────────
          SafeArea(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: ConstrainedBox(
                constraints: BoxConstraints(minHeight: 1.sh - 44),
                child: Padding(
                  padding: EdgeInsets.symmetric(
                    horizontal: 1.sw > 600 ? 48.w : 24.w,
                  ),
                  child: Column(
                    children: [
                      SizedBox(height: compact ? 20.h : 36.h),

                      // ── LOGO ──────────────────────────────────────────
                      Image.asset(
                            'assets/tru_logo.png',
                            width: 200.w,
                            height: 200.h,
                            fit: BoxFit.contain,
                            errorBuilder: (context, error, stackTrace) {
                              return Container(
                                width: 200.w,
                                height: 200.h,
                                decoration: BoxDecoration(
                                  color: TW.amber.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(20.r),
                                ),
                              );
                            },
                          )
                          .animate()
                          .fadeIn(duration: 600.ms)
                          .scale(
                            begin: const Offset(0.65, 0.65),
                            duration: 600.ms,
                            curve: Curves.elasticOut,
                          ),

                      SizedBox(height: compact ? 16.h : 22.h),

                      // ── BRAND TEXT ────────────────────────────────────
                      Container(
                            padding: EdgeInsets.symmetric(
                              horizontal: 16.w,
                              vertical: 8.h,
                            ),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  TW.navy.withOpacity(0.08),
                                  TW.amber.withOpacity(0.08),
                                ],
                                begin: Alignment.centerLeft,
                                end: Alignment.centerRight,
                              ),
                              borderRadius: BorderRadius.circular(12.r),
                              border: Border.all(
                                color: TW.navy.withOpacity(0.2),
                                width: 0.8.w,
                              ),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  'PASSPORT',
                                  style: GoogleFonts.outfit(
                                    fontSize: 9.5.sp,
                                    letterSpacing: 2.5.w,
                                    fontWeight: FontWeight.w600,
                                    color: TW.navy,
                                  ),
                                ),
                                SizedBox(width: 6.w),
                                Text(
                                  'SCANNER',
                                  style: GoogleFonts.outfit(
                                    fontSize: 9.5.sp,
                                    letterSpacing: 2.5.w,
                                    fontWeight: FontWeight.w600,
                                    color: TW.amber,
                                  ),
                                ),
                              ],
                            ),
                          )
                          .animate(delay: 200.ms)
                          .fadeIn(duration: 500.ms)
                          .slideY(
                            begin: 0.2,
                            duration: 500.ms,
                            curve: Curves.easeOut,
                          ),

                      SizedBox(height: compact ? 24.h : 36.h),

                      // ── CARD ──────────────────────────────────────────
                      ClipRRect(
                        borderRadius: BorderRadius.circular(28.r),
                        child: BackdropFilter(
                          filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
                          child: Container(
                            padding: EdgeInsets.fromLTRB(
                              26.w,
                              compact ? 28.h : 34.h,
                              26.w,
                              compact ? 26.h : 32.h,
                            ),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: [
                                  Colors.white.withOpacity(0.70),
                                  Colors.white.withOpacity(0.55),
                                ],
                              ),
                              borderRadius: BorderRadius.circular(28.r),
                              border: Border.all(
                                color: TW.peach.withOpacity(0.55),
                                width: 1.2.w,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: TW.brown.withOpacity(0.05),
                                  blurRadius: 50.r,
                                  spreadRadius: 2.r,
                                  offset: Offset(0, 16.h),
                                ),
                                BoxShadow(
                                  color: TW.amber.withOpacity(0.07),
                                  blurRadius: 20.r,
                                  offset: Offset(0, 4.h),
                                ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Heading
                                Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Welcome Back',
                                          style: GoogleFonts.outfit(
                                            fontSize: 26.sp,
                                            fontWeight: FontWeight.w700,
                                            color: TW.brown,
                                            height: 1.1,
                                          ),
                                        ),
                                        SizedBox(height: 4.h),
                                        Text(
                                          'Sign in to continue scanning',
                                          style: GoogleFonts.outfit(
                                            fontSize: 13.sp,
                                            color: TW.brown.withOpacity(0.45),
                                            fontWeight: FontWeight.w400,
                                            letterSpacing: 0.1.w,
                                          ),
                                        ),
                                        SizedBox(height: 6.h),
                                        Container(
                                          width: 36.w,
                                          height: 2.5.h,
                                          decoration: BoxDecoration(
                                            gradient: const LinearGradient(
                                              colors: [TW.navy, TW.amber],
                                              begin: Alignment.centerLeft,
                                              end: Alignment.centerRight,
                                            ),
                                            borderRadius: BorderRadius.circular(
                                              2.r,
                                            ),
                                          ),
                                        ),
                                      ],
                                    )
                                    .animate(delay: 250.ms)
                                    .fadeIn(duration: 500.ms)
                                    .slideY(
                                      begin: 0.2,
                                      duration: 500.ms,
                                      curve: Curves.easeOut,
                                    ),

                                SizedBox(height: compact ? 20.h : 28.h),

                                // Email
                                TWTextField(
                                      label: 'Email',
                                      hint: 'you@example.com',
                                      icon: Icons.alternate_email_rounded,
                                      controller: _emailCtrl,
                                      keyboardType: TextInputType.emailAddress,
                                    )
                                    .animate(delay: 350.ms)
                                    .fadeIn(duration: 500.ms)
                                    .slideY(
                                      begin: 0.2,
                                      duration: 500.ms,
                                      curve: Curves.easeOut,
                                    ),

                                SizedBox(height: compact ? 16.h : 20.h),

                                // Password
                                TWTextField(
                                      label: 'Password',
                                      hint: '••••••••',
                                      icon: Icons.lock_outline_rounded,
                                      controller: _passCtrl,
                                      obscure: true,
                                    )
                                    .animate(delay: 450.ms)
                                    .fadeIn(duration: 500.ms)
                                    .slideY(
                                      begin: 0.2,
                                      duration: 500.ms,
                                      curve: Curves.easeOut,
                                    ),

                                SizedBox(height: compact ? 20.h : 28.h),

                                // Button
                                ShimmerButton(
                                      isLoading: _isLoading,
                                      onTap: _isLoading ? null : _login,
                                    )
                                    .animate(delay: 550.ms)
                                    .fadeIn(duration: 500.ms)
                                    .slideY(
                                      begin: 0.2,
                                      duration: 500.ms,
                                      curve: Curves.easeOut,
                                    ),
                              ],
                            ),
                          ),
                        ),
                      ),

                      SizedBox(height: compact ? 14.h : 20.h),

                      // ── FOOTER ────────────────────────────────────────
                      Padding(
                        padding: EdgeInsets.only(bottom: 8.h),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.verified_user_outlined,
                              size: 12.sp,
                              color: TW.brown.withOpacity(0.28),
                            ),
                            SizedBox(width: 5.w),
                            Text(
                              '© 2026 · Secured by AES-256',
                              style: GoogleFonts.outfit(
                                fontSize: 10.sp,
                                color: TW.brown.withOpacity(0.28),
                                letterSpacing: 0.2.w,
                              ),
                            ),
                          ],
                        ),
                      ).animate(delay: 750.ms).fadeIn(duration: 500.ms),

                      SizedBox(height: 16.h),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _hairline() => Expanded(
    child: Container(height: 1.h, color: TW.brown.withOpacity(0.12)),
  );
}

class OfficerHomeShell extends StatefulWidget {
  final Map<String, dynamic>? user;
  final String authToken;

  const OfficerHomeShell({super.key, this.user, required this.authToken});

  @override
  State<OfficerHomeShell> createState() => _OfficerHomeShellState();
}

class _OfficerHomeShellState extends State<OfficerHomeShell> {
  late Map<String, dynamic> _user;

  @override
  void initState() {
    super.initState();
    _user = Map<String, dynamic>.from(widget.user ?? {});
  }

  void _openFeature(BuildContext context, String title, String message) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => FeaturePlaceholderPage(title: title, message: message),
      ),
    );
  }

  void _openPendingScans(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => PendingScansPage(
          authToken: widget.authToken,
          userEmail: (_user['email'] ?? '').toString(),
        ),
      ),
    );
  }

  void _openSearch(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => SearchPage(
          authToken: widget.authToken,
          userEmail: (_user['email'] ?? '').toString(),
        ),
      ),
    );
  }

  Future<void> _openProfile(BuildContext context) async {
    final result = await Navigator.of(context).push<Map<String, dynamic>>(
      MaterialPageRoute(
        builder: (_) => ProfilePage(authToken: widget.authToken, user: _user),
      ),
    );

    if (result != null && mounted) {
      setState(() {
        _user.addAll(result);
      });
    }
  }

  void _handleBottomTab(BuildContext context, int index) {
    if (index == 0) {
      _openPendingScans(context);
      return;
    }

    if (index == 2) {
      _openSearch(context);
    }
  }

  void _logout(BuildContext context) {
    Navigator.of(
      context,
    ).pushReplacement(MaterialPageRoute(builder: (_) => const LoginPage()));
  }

  @override
  Widget build(BuildContext context) {
    return HomePage(
      user: _user,
      authToken: widget.authToken,
      onProfileTap: () => _openProfile(context),
      onLogoutTap: () => _logout(context),
      onScanTap: () => _openFeature(
        context,
        'Passport Scanner',
        'Camera capture and upload to pending queue will be implemented next.',
      ),
      onViewAllTap: () => _openPendingScans(context),
      onTabSelected: (index) => _handleBottomTab(context, index),
    );
  }
}

class FeaturePlaceholderPage extends StatelessWidget {
  final String title;
  final String message;

  const FeaturePlaceholderPage({
    super.key,
    required this.title,
    required this.message,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(
            message,
            textAlign: TextAlign.center,
            style: GoogleFonts.outfit(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: TW.brown,
            ),
          ),
        ),
      ),
    );
  }
}
