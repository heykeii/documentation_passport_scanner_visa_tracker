import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';
import 'package:google_fonts/google_fonts.dart';

void main() {
  runApp(const ProviderScope(child: PassportScannerApp()));
}

final authStateProvider = StateProvider<bool>((ref) => false);

class PassportScannerApp extends ConsumerWidget {
  const PassportScannerApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isLoggedIn = ref.watch(authStateProvider);

    final router = GoRouter(
      initialLocation: '/login',
      routes: <RouteBase>[
        GoRoute(path: '/login', builder: (context, state) => const LoginPage()),
        GoRoute(path: '/home', builder: (context, state) => const HomePage()),
      ],
      redirect: (context, state) {
        final goingToLogin = state.matchedLocation == '/login';

        if (!isLoggedIn && !goingToLogin) return '/login';
        if (isLoggedIn && goingToLogin) return '/home';
        return null;
      },
    );

    return ShadApp.router(
      title: 'Docs Passport Scanner',
      debugShowCheckedModeBanner: false,
      routerConfig: router,
    );
  }
}

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage>
    with SingleTickerProviderStateMixin {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _isLoading = false;

  late AnimationController _animController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _animController,
      curve: const Interval(0.2, 1.0, curve: Curves.easeOut),
    );
    _slideAnimation =
        Tween<Offset>(begin: const Offset(0, 0.15), end: Offset.zero).animate(
          CurvedAnimation(
            parent: _animController,
            curve: const Interval(0.2, 1.0, curve: Curves.easeOutCubic),
          ),
        );

    _animController.forward();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _animController.dispose();
    super.dispose();
  }

  void _handleLogin() {
    setState(() => _isLoading = true);
    Future.delayed(const Duration(milliseconds: 1500), () {
      if (mounted) {
        setState(() => _isLoading = false);
        ref.read(authStateProvider.notifier).state = true;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    // Cyber/Tech Dark Theme Colors
    const Color bgDark = Color(0xFF030712);
    // ignore: unused_local_variable
    const Color bgLight = Color(0xFF0F172A);
    const Color accentBlue = Color(0xFF3B82F6);
    const Color accentCyan = Color(0xFF06B6D4);

    return Scaffold(
      backgroundColor: bgDark,
      body: Stack(
        children: [
          // 1. Background Grid & Gradient
          Positioned.fill(
            child: CustomPaint(
              painter: _GridPainter(
                color: accentBlue.withValues(alpha: 0.05),
                spacing: 40,
              ),
            ),
          ),
          Positioned(
            top: -100,
            right: -100,
            child: Container(
              width: 400,
              height: 400,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    accentBlue.withValues(alpha: 0.15),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            bottom: -150,
            left: -100,
            child: Container(
              width: 500,
              height: 500,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    accentCyan.withValues(alpha: 0.1),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          // 2. Main Content
          SafeArea(
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: SlideTransition(
                position: _slideAnimation,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 32),
                      // Header Logo
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: accentBlue.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: accentBlue.withValues(alpha: 0.3),
                              ),
                            ),
                            child: const Icon(
                              Icons.document_scanner_rounded,
                              color: accentBlue,
                              size: 24,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Tradewings',
                                style: GoogleFonts.inter(
                                  color: Colors.white,
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              Text(
                                'DOCUMENTATION',
                                style: GoogleFonts.inter(
                                  color: Colors.white.withValues(alpha: 0.5),
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                  letterSpacing: 1.2,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),

                      const SizedBox(height: 48),

                      // Welcome Text
                      Row(
                        children: [
                          Container(width: 20, height: 1, color: accentBlue),
                          const SizedBox(width: 8),
                          Text(
                            'WELCOME BACK',
                            style: GoogleFonts.inter(
                              color: accentBlue,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 2.0,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Sign in\nto your\naccount.',
                        style: GoogleFonts.inter(
                          color: Colors.white,
                          fontSize: 52,
                          fontWeight: FontWeight.w800,
                          height: 0.95,
                          letterSpacing: -1.0,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Authorized documentation\nstaff access only.',
                        style: GoogleFonts.inter(
                          color: Colors.white.withValues(alpha: 0.5),
                          fontSize: 15,
                          height: 1.4,
                        ),
                      ),

                      const Spacer(),

                      // Form Fields
                      _TechInputField(
                        controller: _emailController,
                        label: 'EMAIL ADDRESS',
                        hint: 'officer@org.ph',
                        icon: Icons.mail_outline_rounded,
                      ),
                      const SizedBox(height: 16),
                      _TechInputField(
                        controller: _passwordController,
                        label: 'PASSWORD',
                        hint: 'Enter your password',
                        icon: Icons.lock_outline_rounded,
                        isPassword: true,
                        obscureText: _obscurePassword,
                        onTogglePassword: () => setState(
                          () => _obscurePassword = !_obscurePassword,
                        ),
                      ),

                      const SizedBox(height: 12),
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton(
                          onPressed: () {},
                          style: TextButton.styleFrom(
                            foregroundColor: Colors.white.withValues(
                              alpha: 0.6,
                            ),
                          ),
                          child: Text(
                            'Forgot password?',
                            style: GoogleFonts.inter(
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ),

                      const SizedBox(height: 24),

                      // Sign In Button
                      GestureDetector(
                        onTap: _isLoading || _emailController.text.isEmpty
                            ? null
                            : _handleLogin,
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 300),
                          height: 64,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(20),
                            gradient: LinearGradient(
                              colors: _isLoading
                                  ? [
                                      const Color(0xFF1E293B),
                                      const Color(0xFF0F172A),
                                    ]
                                  : [
                                      const Color(0xFF3B82F6),
                                      const Color(0xFF2563EB),
                                    ],
                            ),
                            boxShadow: [
                              if (!_isLoading)
                                BoxShadow(
                                  color: accentBlue.withValues(alpha: 0.3),
                                  blurRadius: 20,
                                  offset: const Offset(0, 8),
                                ),
                            ],
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              if (_isLoading)
                                SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    valueColor: AlwaysStoppedAnimation(
                                      Colors.white,
                                    ),
                                  ),
                                )
                              else ...[
                                Text(
                                  'Sign In',
                                  style: GoogleFonts.inter(
                                    color: Colors.white,
                                    fontSize: 18,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Container(
                                  padding: const EdgeInsets.all(4),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.2),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.arrow_forward_rounded,
                                    color: Colors.white,
                                    size: 16,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),

                      const Spacer(),

                      // Footer
                      Center(
                        child: Text(
                          'Secured with JWT',
                          style: GoogleFonts.inter(
                            color: Colors.white.withValues(alpha: 0.3),
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 1.0,
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                          vertical: 12,
                          horizontal: 16,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.03),
                          borderRadius: BorderRadius.circular(100),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.05),
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              width: 6,
                              height: 6,
                              decoration: const BoxDecoration(
                                color: Color(0xFF10B981),
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Restricted • Authorized staff only • v1.0',
                              style: GoogleFonts.inter(
                                color: Colors.white.withValues(alpha: 0.4),
                                fontSize: 11,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
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
}

class _GridPainter extends CustomPainter {
  final Color color;
  final double spacing;

  _GridPainter({required this.color, required this.spacing});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 1;

    for (double x = 0; x < size.width; x += spacing) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }

    for (double y = 0; y < size.height; y += spacing) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _TechInputField extends StatefulWidget {
  final TextEditingController controller;
  final String label;
  final String hint;
  final IconData icon;
  final bool isPassword;
  final bool obscureText;
  final VoidCallback? onTogglePassword;

  const _TechInputField({
    required this.controller,
    required this.label,
    required this.hint,
    required this.icon,
    this.isPassword = false,
    this.obscureText = false,
    this.onTogglePassword,
  });

  @override
  State<_TechInputField> createState() => _TechInputFieldState();
}

class _TechInputFieldState extends State<_TechInputField> {
  bool _isFocused = false;

  @override
  Widget build(BuildContext context) {
    return Focus(
      onFocusChange: (hasFocus) => setState(() => _isFocused = hasFocus),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF0F172A).withValues(alpha: 0.6),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: _isFocused
                ? const Color(0xFF3B82F6)
                : Colors.white.withValues(alpha: 0.1),
            width: 1.5,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.05),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    widget.icon,
                    color: _isFocused
                        ? const Color(0xFF3B82F6)
                        : Colors.white.withValues(alpha: 0.5),
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.label,
                        style: GoogleFonts.inter(
                          color: _isFocused
                              ? const Color(0xFF3B82F6)
                              : Colors.white.withValues(alpha: 0.5),
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 4),
                      TextField(
                        controller: widget.controller,
                        obscureText: widget.obscureText,
                        style: GoogleFonts.inter(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                        ),
                        decoration: InputDecoration(
                          isDense: true,
                          contentPadding: EdgeInsets.zero,
                          hintText: widget.hint,
                          hintStyle: GoogleFonts.inter(
                            color: Colors.white.withValues(alpha: 0.3),
                            fontSize: 16,
                          ),
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                        ),
                      ),
                    ],
                  ),
                ),
                if (widget.isPassword)
                  GestureDetector(
                    onTap: widget.onTogglePassword,
                    child: Icon(
                      widget.obscureText
                          ? Icons.visibility_outlined
                          : Icons.visibility_off_outlined,
                      color: Colors.white.withValues(alpha: 0.4),
                      size: 20,
                    ),
                  ),
                if (!widget.isPassword && widget.controller.text.isNotEmpty)
                  GestureDetector(
                    onTap: widget.controller.clear,
                    child: Icon(
                      Icons.cancel,
                      color: Colors.white.withValues(alpha: 0.4),
                      size: 20,
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Docs Passport Scanner'),
        actions: [
          IconButton(
            onPressed: () {
              ref.read(authStateProvider.notifier).state = false;
            },
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: const Center(
        child: Text(
          'Home placeholder\nStep 1 complete',
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}
