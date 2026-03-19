import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:convert';
import 'dart:math' as math;
import 'dart:ui';
import 'package:http/http.dart' as http;
import 'core/config/app_config.dart';

// ─────────────────────────────────────────────────────────────────────────────
// PALETTE
// ─────────────────────────────────────────────────────────────────────────────
class TW {
  static const sky = Color(0xFFBBE0EF);
  static const navy = Color(0xFF161E54);
  static const navyLt = Color(0xFF1E2A6E);
  static const orange = Color(0xFFF16D34);
  static const peach = Color(0xFFFF986A);
  static const bg = Color(0xFFF0F6FA);
  static const white = Colors.white;
  static const card = Color(0xFFFFFFFF);
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO HEADER PAINTER — wave + dot mesh + arc rings
// ─────────────────────────────────────────────────────────────────────────────
class HeaderPainter extends CustomPainter {
  final double t;
  HeaderPainter(this.t);

  @override
  void paint(Canvas canvas, Size s) {
    // Base gradient fill
    final bg = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [TW.navyLt, TW.navy],
      ).createShader(Rect.fromLTWH(0, 0, s.width, s.height));
    canvas.drawRect(Rect.fromLTWH(0, 0, s.width, s.height), bg);

    // Soft sky orb — top right
    canvas.drawCircle(
      Offset(s.width * 0.85, s.height * 0.15),
      s.width * 0.42,
      Paint()
        ..shader =
            RadialGradient(
              colors: [TW.sky.withOpacity(0.22), TW.sky.withOpacity(0.0)],
            ).createShader(
              Rect.fromCircle(
                center: Offset(s.width * 0.85, s.height * 0.15),
                radius: s.width * 0.42,
              ),
            ),
    );

    // Orange orb — bottom left
    canvas.drawCircle(
      Offset(s.width * 0.08, s.height * 0.88),
      s.width * 0.35,
      Paint()
        ..shader =
            RadialGradient(
              colors: [TW.orange.withOpacity(0.20), TW.orange.withOpacity(0.0)],
            ).createShader(
              Rect.fromCircle(
                center: Offset(s.width * 0.08, s.height * 0.88),
                radius: s.width * 0.35,
              ),
            ),
    );

    // Arc rings — bottom right
    final rp = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;
    for (int i = 0; i < 4; i++) {
      final r = s.width * (0.20 + i * 0.12);
      rp.color = TW.sky.withOpacity(0.08 + i * 0.02);
      canvas.drawArc(
        Rect.fromCircle(
          center: Offset(s.width * 1.05, s.height * 1.1),
          radius: r,
        ),
        -math.pi,
        math.pi * 0.6,
        false,
        rp,
      );
    }

    // Dot grid
    final dp = Paint()..color = TW.white.withOpacity(0.05);
    for (double x = 16; x < s.width; x += 22) {
      for (double y = 16; y < s.height; y += 22) {
        canvas.drawCircle(Offset(x, y), 1.1, dp);
      }
    }

    // Animated wave at bottom
    final wavePaint = Paint()
      ..color = TW.bg
      ..style = PaintingStyle.fill;
    final wavePath = Path();
    wavePath.moveTo(0, s.height - 24);
    for (double x = 0; x <= s.width; x++) {
      final y =
          s.height -
          24 +
          math.sin((x / s.width * 2 * math.pi) + t * 2 * math.pi) * 8;
      wavePath.lineTo(x, y);
    }
    wavePath.lineTo(s.width, s.height);
    wavePath.lineTo(0, s.height);
    wavePath.close();
    canvas.drawPath(wavePath, wavePaint);
  }

  @override
  bool shouldRepaint(HeaderPainter old) => old.t != t;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCAN CARD PAINTER — pulsing ring + corner brackets
// ─────────────────────────────────────────────────────────────────────────────
class ScanCardPainter extends CustomPainter {
  final double pulse;
  ScanCardPainter(this.pulse);

  @override
  void paint(Canvas canvas, Size s) {
    final cx = s.width / 2, cy = s.height / 2;

    // Pulsing outer ring
    final ringPaint = Paint()
      ..color = TW.sky.withOpacity(0.25 * (1 - pulse))
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    canvas.drawCircle(Offset(cx, cy), 36 + pulse * 20, ringPaint);

    // Corner brackets
    final bPaint = Paint()
      ..color = TW.white.withOpacity(0.55)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5
      ..strokeCap = StrokeCap.round;

    const bSize = 16.0;
    const pad = 18.0;
    final corners = [
      [Offset(pad, pad + bSize), Offset(pad, pad), Offset(pad + bSize, pad)],
      [
        Offset(s.width - pad - bSize, pad),
        Offset(s.width - pad, pad),
        Offset(s.width - pad, pad + bSize),
      ],
      [
        Offset(pad, s.height - pad - bSize),
        Offset(pad, s.height - pad),
        Offset(pad + bSize, s.height - pad),
      ],
      [
        Offset(s.width - pad - bSize, s.height - pad),
        Offset(s.width - pad, s.height - pad),
        Offset(s.width - pad, s.height - pad - bSize),
      ],
    ];

    for (final c in corners) {
      final path = Path()
        ..moveTo(c[0].dx, c[0].dy)
        ..lineTo(c[1].dx, c[1].dy)
        ..lineTo(c[2].dx, c[2].dy);
      canvas.drawPath(path, bPaint);
    }

    // Animated scan line
    final lineY = s.height * 0.15 + pulse * s.height * 0.70;
    final linePaint = Paint()
      ..shader = LinearGradient(
        colors: [
          TW.orange.withOpacity(0.0),
          TW.orange.withOpacity(0.85),
          TW.orange.withOpacity(0.0),
        ],
      ).createShader(Rect.fromLTWH(0, lineY - 1, s.width, 2));
    canvas.drawLine(
      Offset(pad + 8, lineY),
      Offset(s.width - pad - 8, lineY),
      linePaint..strokeWidth = 2,
    );
  }

  @override
  bool shouldRepaint(ScanCardPainter old) => old.pulse != pulse;
}

// ─────────────────────────────────────────────────────────────────────────────
// RECENT SCAN ITEM
// ─────────────────────────────────────────────────────────────────────────────
class ScanItem extends StatelessWidget {
  final String name;
  final String nationality;
  final String time;
  final bool verified;
  final int index;

  const ScanItem({
    super.key,
    required this.name,
    required this.nationality,
    required this.time,
    required this.verified,
    required this.index,
  });

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: Duration(milliseconds: 500 + index * 100),
      curve: Curves.easeOut,
      builder: (_, v, child) => Opacity(
        opacity: v,
        child: Transform.translate(
          offset: Offset(0, 20 * (1 - v)),
          child: child,
        ),
      ),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: TW.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: TW.navy.withOpacity(0.06),
              blurRadius: 16,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            // Passport icon badge
            Container(
              width: 46,
              height: 46,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [TW.navy, TW.navyLt],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(13),
                boxShadow: [
                  BoxShadow(
                    color: TW.navy.withOpacity(0.22),
                    blurRadius: 10,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: const Icon(
                Icons.import_contacts_rounded,
                color: TW.sky,
                size: 22,
              ),
            ),
            const SizedBox(width: 14),
            // Name + info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: GoogleFonts.outfit(
                      fontSize: 14.5,
                      fontWeight: FontWeight.w700,
                      color: TW.navy,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Row(
                    children: [
                      Icon(
                        Icons.flag_outlined,
                        size: 11,
                        color: TW.navy.withOpacity(0.35),
                      ),
                      const SizedBox(width: 3),
                      Text(
                        nationality,
                        style: GoogleFonts.outfit(
                          fontSize: 11.5,
                          color: TW.navy.withOpacity(0.45),
                          fontWeight: FontWeight.w400,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Icon(
                        Icons.access_time_rounded,
                        size: 11,
                        color: TW.navy.withOpacity(0.35),
                      ),
                      const SizedBox(width: 3),
                      Text(
                        time,
                        style: GoogleFonts.outfit(
                          fontSize: 11.5,
                          color: TW.navy.withOpacity(0.45),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            // Status chip
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: verified
                    ? const Color(0xFFE8F8F0)
                    : const Color(0xFFFFF3ED),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    verified
                        ? Icons.check_circle_rounded
                        : Icons.pending_rounded,
                    size: 12,
                    color: verified ? const Color(0xFF22C55E) : TW.orange,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    verified ? 'Verified' : 'Pending',
                    style: GoogleFonts.outfit(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: verified ? const Color(0xFF16A34A) : TW.orange,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────────────────────
class StatCard extends StatelessWidget {
  final String value;
  final String label;
  final IconData icon;
  final Color iconBg;
  final Color iconColor;

  const StatCard({
    super.key,
    required this.value,
    required this.label,
    required this.icon,
    required this.iconBg,
    required this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
        decoration: BoxDecoration(
          color: TW.white,
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(
              color: TW.navy.withOpacity(0.07),
              blurRadius: 18,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: iconBg,
                borderRadius: BorderRadius.circular(11),
              ),
              child: Icon(icon, size: 19, color: iconColor),
            ),
            const SizedBox(height: 12),
            Text(
              value,
              style: GoogleFonts.outfit(
                fontSize: 28,
                fontWeight: FontWeight.w700,
                color: TW.navy,
                height: 1.0,
              ),
            ),
            const SizedBox(height: 3),
            Text(
              label,
              style: GoogleFonts.outfit(
                fontSize: 11,
                color: TW.navy.withOpacity(0.45),
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HOME PAGE
// ─────────────────────────────────────────────────────────────────────────────
class HomePage extends StatefulWidget {
  final Map<String, dynamic>? user;
  final String? authToken;
  final VoidCallback? onProfileTap;
  final VoidCallback? onLogoutTap;
  final VoidCallback? onScanTap;
  final VoidCallback? onViewAllTap;
  final ValueChanged<int>? onTabSelected;

  const HomePage({
    super.key,
    this.user,
    this.authToken,
    this.onProfileTap,
    this.onLogoutTap,
    this.onScanTap,
    this.onViewAllTap,
    this.onTabSelected,
  });

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> with TickerProviderStateMixin {
  late AnimationController _waveCtrl;
  late AnimationController _scanCtrl;
  late AnimationController _entryCtrl;

  late Animation<double> _headerSlide;
  late Animation<double> _headerFade;

  bool _isLoadingDashboard = true;
  String? _dashboardError;
  int _totalScans = 0;
  int _pendingScans = 0;
  int _verifiedPercent = 0;
  List<Map<String, dynamic>> _scans = [];

  @override
  void initState() {
    super.initState();
    _waveCtrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    )..repeat();
    _scanCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat();
    _entryCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    )..forward();

    _headerFade = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _entryCtrl,
        curve: const Interval(0.0, 0.6, curve: Curves.easeOut),
      ),
    );
    _headerSlide = Tween<double>(begin: -20, end: 0).animate(
      CurvedAnimation(
        parent: _entryCtrl,
        curve: const Interval(0.0, 0.6, curve: Curves.easeOut),
      ),
    );

    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    final token = widget.authToken;

    if (token == null || token.isEmpty) {
      if (!mounted) return;
      setState(() {
        _isLoadingDashboard = false;
        _dashboardError = 'Missing session token. Please login again.';
      });
      return;
    }

    final headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };

    try {
      final pendingUrl = Uri.parse(AppConfig.pendingScansUrl);

      final pendingResponse = await http.get(pendingUrl, headers: headers);

      if (pendingResponse.statusCode >= 400) {
        throw Exception('Failed to fetch dashboard data');
      }

      final pendingJson =
          jsonDecode(pendingResponse.body) as Map<String, dynamic>;

      final pendingAll =
          (pendingJson['data'] as List?)?.cast<Map<String, dynamic>>() ?? [];
      final userEmail = (widget.user?['email'] ?? '').toString().trim();

      final pending = pendingAll.where((p) {
        final source = (p['source'] ?? '').toString().toLowerCase();
        final scannedBy = (p['scannedBy'] ?? '').toString().trim();

        final isMobileScan = source == 'mobile';
        final isCurrentUser = userEmail.isEmpty || scannedBy == userEmail;

        return isMobileScan && isCurrentUser;
      }).toList();

      final recent = <Map<String, dynamic>>[];

      for (final p in pending) {
        final timestamp = _parseDate(p['scannedAt']);
        recent.add({
          'name': _fullName(p['firstName'], p['surname']),
          'nat': _passportMeta(p['passportNumber']),
          'time': _timeAgo(timestamp),
          'verified': false,
          'sortAt': timestamp?.millisecondsSinceEpoch ?? 0,
        });
      }

      recent.sort((a, b) => (b['sortAt'] as int).compareTo(a['sortAt'] as int));
      final trimmedRecent = recent.take(6).map((e) {
        e.remove('sortAt');
        return e;
      }).toList();

      final total = pending.length;
      const verifiedPercent = 0;

      if (!mounted) return;
      setState(() {
        _totalScans = total;
        _pendingScans = pending.length;
        _verifiedPercent = verifiedPercent;
        _scans = trimmedRecent;
        _dashboardError = null;
        _isLoadingDashboard = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoadingDashboard = false;
        _dashboardError = 'Unable to sync dashboard data.';
      });
    }
  }

  DateTime? _parseDate(dynamic value) {
    if (value == null) return null;
    return DateTime.tryParse(value.toString());
  }

  String _fullName(dynamic firstName, dynamic surname) {
    final first = (firstName ?? '').toString().trim();
    final last = (surname ?? '').toString().trim();
    final name = '$first $last'.trim();
    return name.isEmpty ? 'Unnamed Passenger' : name;
  }

  String _passportMeta(dynamic passportNumber) {
    final no = (passportNumber ?? '').toString().trim();
    return no.isEmpty ? 'Passport record' : 'Passport • $no';
  }

  String _timeAgo(DateTime? time) {
    if (time == null) return 'Unknown';

    final now = DateTime.now();
    final diff = now.difference(time);

    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${(diff.inDays / 7).floor()}w ago';
  }

  @override
  void dispose() {
    _waveCtrl.dispose();
    _scanCtrl.dispose();
    _entryCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final staffName = (widget.user?['name'] ?? 'Documentation Staff')
        .toString()
        .trim();
    final displayName = staffName.isEmpty ? 'Documentation Staff' : staffName;

    return Scaffold(
      backgroundColor: TW.bg,
      body: Stack(
        children: [
          CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              // ── HEADER ──────────────────────────────────────────────────
              SliverToBoxAdapter(
                child: AnimatedBuilder(
                  animation: _waveCtrl,
                  builder: (_, child) => CustomPaint(
                    size: Size(size.width, 260),
                    painter: HeaderPainter(_waveCtrl.value),
                    child: child,
                  ),
                  child: SizedBox(
                    height: 260,
                    child: SafeArea(
                      child: AnimatedBuilder(
                        animation: _entryCtrl,
                        builder: (_, child) => Opacity(
                          opacity: _headerFade.value,
                          child: Transform.translate(
                            offset: Offset(0, _headerSlide.value),
                            child: child,
                          ),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(20, 10, 20, 0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Top bar
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Good day',
                                        style: GoogleFonts.outfit(
                                          fontSize: 12,
                                          color: TW.sky.withOpacity(0.8),
                                          fontWeight: FontWeight.w400,
                                        ),
                                      ),
                                      Text(
                                        displayName,
                                        style: GoogleFonts.outfit(
                                          fontSize: 26,
                                          fontWeight: FontWeight.w700,
                                          color: TW.white,
                                          letterSpacing: 1.0,
                                        ),
                                      ),
                                    ],
                                  ),
                                  Row(
                                    children: [
                                      // Notification bell
                                      Container(
                                        width: 40,
                                        height: 40,
                                        decoration: BoxDecoration(
                                          color: TW.white.withOpacity(0.12),
                                          borderRadius: BorderRadius.circular(
                                            12,
                                          ),
                                          border: Border.all(
                                            color: TW.white.withOpacity(0.15),
                                          ),
                                        ),
                                        child: Stack(
                                          alignment: Alignment.center,
                                          children: [
                                            const Icon(
                                              Icons.notifications_outlined,
                                              color: TW.white,
                                              size: 20,
                                            ),
                                            Positioned(
                                              top: 9,
                                              right: 9,
                                              child: Container(
                                                width: 7,
                                                height: 7,
                                                decoration: const BoxDecoration(
                                                  color: TW.orange,
                                                  shape: BoxShape.circle,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(width: 10),
                                      // Profile Menu
                                      PopupMenuButton(
                                        position: PopupMenuPosition.under,
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(
                                            12,
                                          ),
                                        ),
                                        itemBuilder: (context) => [
                                          PopupMenuItem(
                                            onTap: widget.onProfileTap,
                                            child: Row(
                                              children: [
                                                const Icon(
                                                  Icons.person_outline_rounded,
                                                  size: 18,
                                                  color: TW.navy,
                                                ),
                                                const SizedBox(width: 10),
                                                Text(
                                                  'Profile',
                                                  style: GoogleFonts.outfit(
                                                    color: TW.navy,
                                                    fontWeight: FontWeight.w600,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                          PopupMenuItem(
                                            onTap: widget.onLogoutTap,
                                            child: Row(
                                              children: [
                                                const Icon(
                                                  Icons.logout_rounded,
                                                  size: 18,
                                                  color: const Color(
                                                    0xFFEF4444,
                                                  ),
                                                ),
                                                const SizedBox(width: 10),
                                                Text(
                                                  'Logout',
                                                  style: GoogleFonts.outfit(
                                                    color: const Color(
                                                      0xFFEF4444,
                                                    ),
                                                    fontWeight: FontWeight.w600,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
                                        child: Container(
                                          width: 40,
                                          height: 40,
                                          decoration: BoxDecoration(
                                            gradient: const LinearGradient(
                                              colors: [TW.orange, TW.peach],
                                              begin: Alignment.topLeft,
                                              end: Alignment.bottomRight,
                                            ),
                                            borderRadius: BorderRadius.circular(
                                              12,
                                            ),
                                            boxShadow: [
                                              BoxShadow(
                                                color: TW.orange.withOpacity(
                                                  0.35,
                                                ),
                                                blurRadius: 10,
                                                offset: const Offset(0, 3),
                                              ),
                                            ],
                                          ),
                                          child: const Icon(
                                            Icons.person_rounded,
                                            color: TW.white,
                                            size: 20,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),

                              const Spacer(),

                              // Passport Scanner label
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 5,
                                ),
                                decoration: BoxDecoration(
                                  color: TW.orange.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                    color: TW.orange.withOpacity(0.35),
                                  ),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Container(
                                      width: 6,
                                      height: 6,
                                      decoration: const BoxDecoration(
                                        color: TW.orange,
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      'PASSPORT SCANNER',
                                      style: GoogleFonts.outfit(
                                        fontSize: 9.5,
                                        letterSpacing: 2.5,
                                        fontWeight: FontWeight.w600,
                                        color: TW.peach,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 32),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),

              // ── BODY ────────────────────────────────────────────────────
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    // ── SCAN NOW CARD ──────────────────────────────────
                    const SizedBox(height: 4),
                    _ScanNowCard(scanCtrl: _scanCtrl, onTap: widget.onScanTap),
                    const SizedBox(height: 24),

                    // ── STATS ROW ──────────────────────────────────────
                    Row(
                      children: [
                        Text(
                          'Overview',
                          style: GoogleFonts.outfit(
                            fontSize: 22,
                            fontWeight: FontWeight.w700,
                            color: TW.navy,
                          ),
                        ),
                        const Spacer(),
                        Text(
                          'This Month',
                          style: GoogleFonts.outfit(
                            fontSize: 12,
                            color: TW.navy.withOpacity(0.4),
                          ),
                        ),
                        const SizedBox(width: 4),
                        Icon(
                          Icons.keyboard_arrow_down_rounded,
                          size: 16,
                          color: TW.navy.withOpacity(0.4),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    if (_isLoadingDashboard)
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 18),
                        child: Center(child: CircularProgressIndicator()),
                      )
                    else
                      Row(
                        children: [
                          StatCard(
                            value: _totalScans.toString(),
                            label: 'Total Scans',
                            icon: Icons.document_scanner_outlined,
                            iconBg: const Color(0xFFEEF2FF),
                            iconColor: TW.navyLt,
                          ),
                          const SizedBox(width: 12),
                          StatCard(
                            value: '$_verifiedPercent%',
                            label: 'Verified',
                            icon: Icons.verified_rounded,
                            iconBg: const Color(0xFFFFF0E8),
                            iconColor: TW.orange,
                          ),
                          const SizedBox(width: 12),
                          StatCard(
                            value: _pendingScans.toString(),
                            label: 'Pending',
                            icon: Icons.pending_actions_rounded,
                            iconBg: const Color(0xFFEBF6FC),
                            iconColor: const Color(0xFF38A8C8),
                          ),
                        ],
                      ),

                    const SizedBox(height: 28),

                    // ── RECENT SCANS ──────────────────────────────────
                    Row(
                      children: [
                        Text(
                          'Recent Scans',
                          style: GoogleFonts.outfit(
                            fontSize: 22,
                            fontWeight: FontWeight.w700,
                            color: TW.navy,
                          ),
                        ),
                        const Spacer(),
                        GestureDetector(
                          onTap: widget.onViewAllTap,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 5,
                            ),
                            decoration: BoxDecoration(
                              color: TW.orange.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              'View All',
                              style: GoogleFonts.outfit(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: TW.orange,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    if (_dashboardError != null)
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF3ED),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Text(
                          _dashboardError!,
                          style: GoogleFonts.outfit(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: TW.orange,
                          ),
                        ),
                      )
                    else if (_scans.isEmpty && !_isLoadingDashboard)
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: TW.white,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Text(
                          'No scans found yet.',
                          style: GoogleFonts.outfit(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: TW.navy.withOpacity(0.6),
                          ),
                        ),
                      )
                    else
                      ...List.generate(
                        _scans.length,
                        (i) => ScanItem(
                          name: _scans[i]['name'] as String,
                          nationality: _scans[i]['nat'] as String,
                          time: _scans[i]['time'] as String,
                          verified: _scans[i]['verified'] as bool,
                          index: i,
                        ),
                      ),
                  ]),
                ),
              ),
            ],
          ),

          // ── BOTTOM NAV ──────────────────────────────────────────────────
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: _BottomNav(
              selected: 1, // Always show Home (index 1) as selected
              onTap: (i) {
                // Navigate to other tabs without changing selected state
                if (i != 1) {
                  widget.onTabSelected?.call(i);
                }
              },
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SCAN NOW CARD
// ─────────────────────────────────────────────────────────────────────────────
class _ScanNowCard extends StatelessWidget {
  final AnimationController scanCtrl;
  final VoidCallback? onTap;

  const _ScanNowCard({required this.scanCtrl, this.onTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 180,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [TW.navy, TW.navyLt],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: TW.navy.withOpacity(0.35),
            blurRadius: 30,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Stack(
        children: [
          // Background art
          AnimatedBuilder(
            animation: scanCtrl,
            builder: (_, __) => CustomPaint(
              size: const Size(double.infinity, 180),
              painter: ScanCardPainter(scanCtrl.value),
            ),
          ),

          // Content
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: Row(
              children: [
                // Left — text
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: TW.orange.withOpacity(0.18),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: TW.orange.withOpacity(0.30),
                          ),
                        ),
                        child: Text(
                          'READY TO SCAN',
                          style: GoogleFonts.outfit(
                            fontSize: 9,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 2.0,
                            color: TW.peach,
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'Scan\nPassport',
                        style: GoogleFonts.outfit(
                          fontSize: 28,
                          fontWeight: FontWeight.w700,
                          color: TW.white,
                          height: 1.1,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Scan passport photo page then send to pending queue',
                        style: GoogleFonts.outfit(
                          fontSize: 11.5,
                          color: TW.sky.withOpacity(0.75),
                          fontWeight: FontWeight.w400,
                        ),
                      ),
                    ],
                  ),
                ),

                // Right — button
                GestureDetector(
                  onTap: onTap,
                  child: Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [TW.orange, TW.peach],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: TW.orange.withOpacity(0.45),
                          blurRadius: 22,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        // Gloss
                        Positioned(
                          top: 6,
                          left: 8,
                          child: Container(
                            width: 28,
                            height: 14,
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.18),
                              borderRadius: BorderRadius.circular(20),
                            ),
                          ),
                        ),
                        const Icon(
                          Icons.document_scanner_rounded,
                          color: TW.white,
                          size: 30,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BOTTOM NAVIGATION
// ─────────────────────────────────────────────────────────────────────────────
class _BottomNav extends StatelessWidget {
  final int selected;
  final ValueChanged<int> onTap;

  const _BottomNav({required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          padding: const EdgeInsets.fromLTRB(24, 12, 24, 28),
          decoration: BoxDecoration(
            color: TW.white.withOpacity(0.88),
            border: Border(top: BorderSide(color: TW.navy.withOpacity(0.07))),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _NavItem(
                icon: Icons.pending_actions_rounded,
                label: 'Pending',
                index: 0,
                selected: selected,
                onTap: onTap,
              ),
              _NavItem(
                icon: Icons.document_scanner_rounded,
                label: 'Scan',
                index: 1,
                selected: selected,
                onTap: onTap,
              ),
              _NavItem(
                icon: Icons.search_rounded,
                label: 'Search',
                index: 2,
                selected: selected,
                onTap: onTap,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final int index;
  final int selected;
  final ValueChanged<int> onTap;

  const _NavItem({
    required this.icon,
    required this.label,
    required this.index,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isSelected = index == selected;

    return GestureDetector(
      onTap: () => onTap(index),
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
        padding: EdgeInsets.symmetric(
          horizontal: isSelected ? 20 : 12,
          vertical: 8,
        ),
        decoration: BoxDecoration(
          color: isSelected ? TW.navy : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: TW.navy.withOpacity(0.25),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ]
              : [],
        ),
        child: Row(
          children: [
            Icon(
              icon,
              size: 20,
              color: isSelected ? TW.white : TW.navy.withOpacity(0.35),
            ),
            if (isSelected) ...[
              const SizedBox(width: 7),
              Text(
                label,
                style: GoogleFonts.outfit(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: TW.white,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
