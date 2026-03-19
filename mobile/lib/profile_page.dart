import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;

import 'core/config/app_config.dart';

class TWProfile {
  static const sky = Color(0xFFBBE0EF);
  static const navy = Color(0xFF161E54);
  static const navyLt = Color(0xFF1E2A6E);
  static const orange = Color(0xFFF16D34);
  static const peach = Color(0xFFFF986A);
  static const bg = Color(0xFFF0F6FA);
  static const white = Colors.white;
}

class ProfilePage extends StatefulWidget {
  final String authToken;
  final Map<String, dynamic>? user;

  const ProfilePage({super.key, required this.authToken, this.user});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  final _nameCtrl = TextEditingController();
  final _currentPassCtrl = TextEditingController();
  final _newPassCtrl = TextEditingController();
  final _confirmPassCtrl = TextEditingController();

  bool _loadingProfile = true;
  bool _savingName = false;
  bool _savingPassword = false;

  bool _hideCurrent = true;
  bool _hideNew = true;
  bool _hideConfirm = true;

  String _email = '';
  String _role = '';

  @override
  void initState() {
    super.initState();

    _nameCtrl.text = (widget.user?['name'] ?? '').toString();
    _email = (widget.user?['email'] ?? '').toString();
    _role = (widget.user?['role'] ?? 'documentation').toString();

    _loadLatestProfile();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _currentPassCtrl.dispose();
    _newPassCtrl.dispose();
    _confirmPassCtrl.dispose();
    super.dispose();
  }

  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ${widget.authToken}',
  };

  Future<void> _loadLatestProfile() async {
    setState(() => _loadingProfile = true);

    try {
      final response = await http.get(
        Uri.parse(AppConfig.currentUserUrl),
        headers: _headers,
      );

      final body = jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode >= 400 || body['success'] != true) {
        throw Exception(body['error'] ?? 'Failed to load profile');
      }

      final user = (body['user'] as Map?)?.cast<String, dynamic>() ?? {};

      if (!mounted) return;
      setState(() {
        _nameCtrl.text = (user['name'] ?? _nameCtrl.text).toString();
        _email = (user['email'] ?? _email).toString();
        _role = (user['role'] ?? _role).toString();
        _loadingProfile = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loadingProfile = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unable to refresh profile data.')),
      );
    }
  }

  Future<void> _updateName() async {
    final name = _nameCtrl.text.trim();
    if (name.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Name is required.')));
      return;
    }

    setState(() => _savingName = true);

    try {
      final response = await http.put(
        Uri.parse(AppConfig.updateNameUrl),
        headers: _headers,
        body: jsonEncode({'name': name}),
      );

      final body = jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode >= 400 || body['success'] != true) {
        throw Exception(body['error'] ?? 'Failed to update name');
      }

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Name updated successfully.')),
      );

      Navigator.of(context).pop({'name': name, 'email': _email, 'role': _role});
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Failed to update name.')));
    } finally {
      if (mounted) setState(() => _savingName = false);
    }
  }

  Future<void> _updatePassword() async {
    final current = _currentPassCtrl.text;
    final next = _newPassCtrl.text;
    final confirm = _confirmPassCtrl.text;

    if (current.isEmpty || next.isEmpty || confirm.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Complete all password fields.')),
      );
      return;
    }

    if (next.length < 8) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('New password must be at least 8 characters.'),
        ),
      );
      return;
    }

    if (next != confirm) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('New passwords do not match.')),
      );
      return;
    }

    setState(() => _savingPassword = true);

    try {
      final response = await http.put(
        Uri.parse(AppConfig.updatePasswordUrl),
        headers: _headers,
        body: jsonEncode({'currentPassword': current, 'newPassword': next}),
      );

      final body = jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode >= 400 || body['success'] != true) {
        throw Exception(body['error'] ?? 'Failed to update password');
      }

      if (!mounted) return;

      _currentPassCtrl.clear();
      _newPassCtrl.clear();
      _confirmPassCtrl.clear();

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Password updated successfully.')),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to update password.')),
      );
    } finally {
      if (mounted) setState(() => _savingPassword = false);
    }
  }

  InputDecoration _decoration(
    String label, {
    Widget? suffixIcon,
    String? hint,
  }) {
    return InputDecoration(
      labelText: label,
      hintText: hint,
      labelStyle: GoogleFonts.outfit(color: TWProfile.navy.withOpacity(0.6)),
      filled: true,
      fillColor: TWProfile.white,
      suffixIcon: suffixIcon,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: TWProfile.sky.withOpacity(0.35)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: TWProfile.navy, width: 1.2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: TWProfile.bg,
      body: SafeArea(
        child: _loadingProfile
            ? const Center(child: CircularProgressIndicator())
            : CustomScrollView(
                physics: const BouncingScrollPhysics(),
                slivers: [
                  SliverToBoxAdapter(
                    child: Container(
                      margin: const EdgeInsets.fromLTRB(16, 10, 16, 14),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [TWProfile.navyLt, TWProfile.navy],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(22),
                      ),
                      child: Row(
                        children: [
                          IconButton(
                            onPressed: () => Navigator.of(context).pop(),
                            icon: const Icon(Icons.arrow_back_ios_new_rounded),
                            color: Colors.white,
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Profile Settings',
                                  style: GoogleFonts.outfit(
                                    fontSize: 24,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.white,
                                  ),
                                ),
                                Text(
                                  'Update your account details securely',
                                  style: GoogleFonts.outfit(
                                    fontSize: 12,
                                    color: TWProfile.sky,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: TWProfile.orange,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(
                              Icons.person_rounded,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                    sliver: SliverList(
                      delegate: SliverChildListDelegate([
                        _sectionCard(
                          title: 'Account',
                          subtitle:
                              'Your website and mobile account share this same data.',
                          child: Column(
                            children: [
                              TextField(
                                controller: _nameCtrl,
                                style: GoogleFonts.outfit(
                                  color: TWProfile.navy,
                                ),
                                decoration: _decoration('Display Name'),
                              ),
                              const SizedBox(height: 12),
                              _readonlyField(label: 'Email', value: _email),
                              const SizedBox(height: 12),
                              _readonlyField(label: 'Role', value: _role),
                              const SizedBox(height: 16),
                              SizedBox(
                                width: double.infinity,
                                child: FilledButton.icon(
                                  style: FilledButton.styleFrom(
                                    backgroundColor: TWProfile.navy,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(
                                      vertical: 14,
                                    ),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                  ),
                                  onPressed: _savingName ? null : _updateName,
                                  icon: _savingName
                                      ? const SizedBox(
                                          width: 14,
                                          height: 14,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            color: Colors.white,
                                          ),
                                        )
                                      : const Icon(Icons.save_rounded),
                                  label: Text(
                                    'Save Name',
                                    style: GoogleFonts.outfit(
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 14),
                        _sectionCard(
                          title: 'Change Password',
                          subtitle:
                              'Password updates take effect on both mobile and website login.',
                          child: Column(
                            children: [
                              TextField(
                                controller: _currentPassCtrl,
                                obscureText: _hideCurrent,
                                style: GoogleFonts.outfit(
                                  color: TWProfile.navy,
                                ),
                                decoration: _decoration(
                                  'Current Password',
                                  suffixIcon: IconButton(
                                    onPressed: () => setState(
                                      () => _hideCurrent = !_hideCurrent,
                                    ),
                                    icon: Icon(
                                      _hideCurrent
                                          ? Icons.visibility_off
                                          : Icons.visibility,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 12),
                              TextField(
                                controller: _newPassCtrl,
                                obscureText: _hideNew,
                                style: GoogleFonts.outfit(
                                  color: TWProfile.navy,
                                ),
                                decoration: _decoration(
                                  'New Password',
                                  hint: 'At least 8 characters',
                                  suffixIcon: IconButton(
                                    onPressed: () =>
                                        setState(() => _hideNew = !_hideNew),
                                    icon: Icon(
                                      _hideNew
                                          ? Icons.visibility_off
                                          : Icons.visibility,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 12),
                              TextField(
                                controller: _confirmPassCtrl,
                                obscureText: _hideConfirm,
                                style: GoogleFonts.outfit(
                                  color: TWProfile.navy,
                                ),
                                decoration: _decoration(
                                  'Confirm New Password',
                                  suffixIcon: IconButton(
                                    onPressed: () => setState(
                                      () => _hideConfirm = !_hideConfirm,
                                    ),
                                    icon: Icon(
                                      _hideConfirm
                                          ? Icons.visibility_off
                                          : Icons.visibility,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 16),
                              SizedBox(
                                width: double.infinity,
                                child: FilledButton.icon(
                                  style: FilledButton.styleFrom(
                                    backgroundColor: TWProfile.orange,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(
                                      vertical: 14,
                                    ),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                  ),
                                  onPressed: _savingPassword
                                      ? null
                                      : _updatePassword,
                                  icon: _savingPassword
                                      ? const SizedBox(
                                          width: 14,
                                          height: 14,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            color: Colors.white,
                                          ),
                                        )
                                      : const Icon(Icons.lock_reset_rounded),
                                  label: Text(
                                    'Update Password',
                                    style: GoogleFonts.outfit(
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ]),
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _sectionCard({
    required String title,
    required String subtitle,
    required Widget child,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: TWProfile.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: TWProfile.navy.withOpacity(0.06),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.outfit(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: TWProfile.navy,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: GoogleFonts.outfit(
              fontSize: 12,
              color: TWProfile.navy.withOpacity(0.6),
            ),
          ),
          const SizedBox(height: 14),
          child,
        ],
      ),
    );
  }

  Widget _readonlyField({required String label, required String value}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
      decoration: BoxDecoration(
        color: TWProfile.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: TWProfile.sky.withOpacity(0.35)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: GoogleFonts.outfit(
              fontSize: 11,
              color: TWProfile.navy.withOpacity(0.6),
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            value.isEmpty ? '-' : value,
            style: GoogleFonts.outfit(
              fontSize: 14,
              color: TWProfile.navy,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
