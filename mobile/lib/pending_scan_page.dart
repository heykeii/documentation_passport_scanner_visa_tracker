import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;

import 'core/config/app_config.dart';

class TWPending {
  static const sky = Color(0xFFBBE0EF);
  static const navy = Color(0xFF161E54);
  static const navyLt = Color(0xFF1E2A6E);
  static const orange = Color(0xFFF16D34);
  static const peach = Color(0xFFFF986A);
  static const bg = Color(0xFFF0F6FA);
  static const white = Colors.white;
}

class PendingScansPage extends StatefulWidget {
  final String authToken;
  final String? userEmail;

  const PendingScansPage({super.key, required this.authToken, this.userEmail});

  @override
  State<PendingScansPage> createState() => _PendingScansPageState();
}

class _PendingScansPageState extends State<PendingScansPage> {
  final TextEditingController _searchCtrl = TextEditingController();

  bool _isLoading = true;
  String? _error;
  List<Map<String, dynamic>> _pending = [];
  final Set<String> _busyScanIds = <String>{};

  @override
  void initState() {
    super.initState();
    _loadPending();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ${widget.authToken}',
  };

  List<Map<String, dynamic>> get _filtered {
    final q = _searchCtrl.text.trim().toLowerCase();
    if (q.isEmpty) return _pending;

    return _pending.where((scan) {
      final fullName = _fullName(scan).toLowerCase();
      final passport = (scan['passportNumber'] ?? '').toString().toLowerCase();
      return fullName.contains(q) || passport.contains(q);
    }).toList();
  }

  Future<void> _loadPending() async {
    if (!mounted) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await http.get(
        Uri.parse(AppConfig.pendingScansUrl),
        headers: _headers,
      );

      final body = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode >= 400 || body['success'] != true) {
        throw Exception(body['error'] ?? 'Failed to load pending scans.');
      }

      final items = (body['data'] as List?)?.cast<Map<String, dynamic>>() ?? [];

      final userEmail = (widget.userEmail ?? '').trim();
      final filtered = items.where((item) {
        final source = (item['source'] ?? '').toString().toLowerCase();
        final scannedBy = (item['scannedBy'] ?? '').toString().trim();
        final isMobile = source == 'mobile';
        final isCurrentUser = userEmail.isEmpty || scannedBy == userEmail;
        return isMobile && isCurrentUser;
      }).toList();

      filtered.sort((a, b) {
        final at = DateTime.tryParse((a['scannedAt'] ?? '').toString());
        final bt = DateTime.tryParse((b['scannedAt'] ?? '').toString());
        return (bt ?? DateTime.fromMillisecondsSinceEpoch(0)).compareTo(
          at ?? DateTime.fromMillisecondsSinceEpoch(0),
        );
      });

      if (!mounted) return;
      setState(() {
        _pending = filtered;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = 'Unable to load pending scans.';
        _isLoading = false;
      });
    }
  }

  Future<void> _deleteScan(String scanId) async {
    setState(() => _busyScanIds.add(scanId));

    try {
      final response = await http.delete(
        Uri.parse('${AppConfig.apiBaseUrl}/mobile-scan/$scanId'),
        headers: _headers,
      );

      final body = jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode >= 400 || body['success'] != true) {
        throw Exception(body['error'] ?? 'Delete failed');
      }

      if (!mounted) return;
      setState(() {
        _pending.removeWhere((e) => (e['scanId'] ?? '').toString() == scanId);
      });

      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Pending scan removed.')));
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to remove pending scan.')),
      );
    } finally {
      if (mounted) {
        setState(() => _busyScanIds.remove(scanId));
      }
    }
  }

  Future<void> _openConfirmSheet(Map<String, dynamic> item) async {
    final portalRefCtrl = TextEditingController();
    final agencyCtrl = TextEditingController();
    final embassyCtrl = TextEditingController();
    String payment = '';
    bool submitting = false;

    Future<void> submit(StateSetter setModalState) async {
      final scanId = (item['scanId'] ?? '').toString();
      final portalRefNo = portalRefCtrl.text.trim();
      if (scanId.isEmpty || portalRefNo.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Portal Ref No is required.')),
        );
        return;
      }

      setModalState(() => submitting = true);
      setState(() => _busyScanIds.add(scanId));

      try {
        final payload = {
          'portalRefNo': portalRefNo,
          'agency': agencyCtrl.text.trim(),
          'embassy': embassyCtrl.text.trim(),
          'payment': payment,
        };

        final response = await http.post(
          Uri.parse('${AppConfig.apiBaseUrl}/mobile-scan/$scanId/confirm'),
          headers: _headers,
          body: jsonEncode(payload),
        );

        final body = jsonDecode(response.body) as Map<String, dynamic>;
        if (response.statusCode >= 400 || body['success'] != true) {
          throw Exception(body['error'] ?? 'Confirmation failed');
        }

        if (!mounted) return;
        Navigator.of(context).pop();
        setState(() {
          _pending.removeWhere((e) => (e['scanId'] ?? '').toString() == scanId);
        });

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Scan confirmed and sent to records.')),
        );
      } catch (_) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to confirm scan.')),
        );
      } finally {
        if (mounted) {
          setState(() => _busyScanIds.remove(scanId));
        }
      }
    }

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 16,
                right: 16,
                bottom: MediaQuery.of(context).viewInsets.bottom + 16,
              ),
              child: Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: TWPending.white,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Confirm Pending Scan',
                      style: GoogleFonts.outfit(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: TWPending.navy,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _fullName(item),
                      style: GoogleFonts.outfit(
                        fontSize: 13,
                        color: TWPending.navy.withOpacity(0.6),
                      ),
                    ),
                    const SizedBox(height: 14),
                    _field(controller: portalRefCtrl, label: 'Portal Ref No *'),
                    const SizedBox(height: 10),
                    _field(controller: agencyCtrl, label: 'Agency'),
                    const SizedBox(height: 10),
                    _field(controller: embassyCtrl, label: 'Embassy'),
                    const SizedBox(height: 10),
                    DropdownButtonFormField<String>(
                      value: payment,
                      decoration: _inputDecoration('Payment'),
                      items: const [
                        DropdownMenuItem(value: '', child: Text('Unset')),
                        DropdownMenuItem(
                          value: 'partial',
                          child: Text('Partial'),
                        ),
                        DropdownMenuItem(value: 'paid', child: Text('Paid')),
                      ],
                      onChanged: (v) => setModalState(() => payment = v ?? ''),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        style: FilledButton.styleFrom(
                          backgroundColor: TWPending.navy,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        onPressed: submitting
                            ? null
                            : () => submit(setModalState),
                        child: submitting
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Text('Confirm'),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );

    portalRefCtrl.dispose();
    agencyCtrl.dispose();
    embassyCtrl.dispose();
  }

  InputDecoration _inputDecoration(String label) {
    return InputDecoration(
      labelText: label,
      labelStyle: GoogleFonts.outfit(color: TWPending.navy.withOpacity(0.55)),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
    );
  }

  Widget _field({
    required TextEditingController controller,
    required String label,
  }) {
    return TextField(
      controller: controller,
      style: GoogleFonts.outfit(color: TWPending.navy),
      decoration: _inputDecoration(label),
    );
  }

  String _fullName(Map<String, dynamic> item) {
    final first = (item['firstName'] ?? '').toString().trim();
    final last = (item['surname'] ?? '').toString().trim();
    final name = '$first $last'.trim();
    return name.isEmpty ? 'Unnamed Passenger' : name;
  }

  String _meta(Map<String, dynamic> item) {
    final passportNumber = (item['passportNumber'] ?? '').toString().trim();
    return passportNumber.isEmpty
        ? 'Passport pending'
        : 'Passport • $passportNumber';
  }

  String _timeAgo(Map<String, dynamic> item) {
    final parsed = DateTime.tryParse((item['scannedAt'] ?? '').toString());
    if (parsed == null) return 'Unknown';

    final diff = DateTime.now().difference(parsed);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }

  double _confidence(Map<String, dynamic> item) {
    final confidence = item['confidence'];
    if (confidence is! Map) return 0;

    double total = 0;
    int count = 0;
    for (final value in confidence.values) {
      final n = (value is num) ? value.toDouble() : 0;
      if (n > 0) {
        total += n;
        count++;
      }
    }

    if (count == 0) return 0;
    return (total / count * 100).clamp(0, 100);
  }

  @override
  Widget build(BuildContext context) {
    final scans = _filtered;

    return Scaffold(
      backgroundColor: TWPending.bg,
      body: SafeArea(
        child: Column(
          children: [
            Container(
              margin: const EdgeInsets.fromLTRB(16, 12, 16, 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [TWPending.navyLt, TWPending.navy],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.arrow_back_ios_new_rounded),
                    color: Colors.white,
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Pending Scans',
                          style: GoogleFonts.outfit(
                            color: Colors.white,
                            fontSize: 24,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        Text(
                          '${_pending.length} waiting for confirmation',
                          style: GoogleFonts.outfit(
                            color: TWPending.sky,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: _loadPending,
                    icon: const Icon(Icons.sync_rounded),
                    color: Colors.white,
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: TextField(
                controller: _searchCtrl,
                onChanged: (_) => setState(() {}),
                decoration: InputDecoration(
                  hintText: 'Search by name or passport number',
                  prefixIcon: const Icon(Icons.search_rounded),
                  suffixIcon: _searchCtrl.text.isEmpty
                      ? null
                      : IconButton(
                          onPressed: () {
                            _searchCtrl.clear();
                            setState(() {});
                          },
                          icon: const Icon(Icons.close_rounded),
                        ),
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: RefreshIndicator(
                onRefresh: _loadPending,
                child: _buildContent(scans),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent(List<Map<String, dynamic>> scans) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          const SizedBox(height: 120),
          Center(
            child: Column(
              children: [
                Text(
                  _error!,
                  style: GoogleFonts.outfit(
                    color: TWPending.orange,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 10),
                OutlinedButton(
                  onPressed: _loadPending,
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ],
      );
    }

    if (scans.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          const SizedBox(height: 120),
          Icon(
            Icons.document_scanner_outlined,
            size: 52,
            color: TWPending.navy.withOpacity(0.35),
          ),
          const SizedBox(height: 12),
          Center(
            child: Text(
              'No pending scans yet.',
              style: GoogleFonts.outfit(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: TWPending.navy,
              ),
            ),
          ),
          const SizedBox(height: 6),
          Center(
            child: Text(
              'Captured passport scans will appear here.',
              style: GoogleFonts.outfit(
                fontSize: 13,
                color: TWPending.navy.withOpacity(0.55),
              ),
            ),
          ),
        ],
      );
    }

    return ListView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 18),
      itemCount: scans.length,
      itemBuilder: (context, index) {
        final item = scans[index];
        final scanId = (item['scanId'] ?? '').toString();
        final busy = _busyScanIds.contains(scanId);
        final confidence = _confidence(item);

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: TWPending.navy.withOpacity(0.06),
                blurRadius: 16,
                offset: const Offset(0, 5),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: TWPending.navy,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.document_scanner_rounded,
                      color: TWPending.sky,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _fullName(item),
                          style: GoogleFonts.outfit(
                            fontSize: 17,
                            fontWeight: FontWeight.w700,
                            color: TWPending.navy,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${_meta(item)}  •  ${_timeAgo(item)}',
                          style: GoogleFonts.outfit(
                            fontSize: 12,
                            color: TWPending.navy.withOpacity(0.55),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF3ED),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      'Pending',
                      style: GoogleFonts.outfit(
                        color: TWPending.orange,
                        fontWeight: FontWeight.w600,
                        fontSize: 11,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: LinearProgressIndicator(
                  value: confidence / 100,
                  minHeight: 7,
                  backgroundColor: TWPending.sky.withOpacity(0.35),
                  color: TWPending.navyLt,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'OCR confidence ${confidence.toStringAsFixed(0)}%',
                style: GoogleFonts.outfit(
                  fontSize: 11,
                  color: TWPending.navy.withOpacity(0.55),
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(
                          color: TWPending.orange.withOpacity(0.4),
                        ),
                        foregroundColor: TWPending.orange,
                      ),
                      onPressed: busy ? null : () => _deleteScan(scanId),
                      icon: busy
                          ? const SizedBox(
                              width: 14,
                              height: 14,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.delete_outline_rounded),
                      label: Text(
                        'Remove',
                        style: GoogleFonts.outfit(fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: FilledButton.icon(
                      style: FilledButton.styleFrom(
                        backgroundColor: TWPending.navy,
                        foregroundColor: Colors.white,
                      ),
                      onPressed: busy ? null : () => _openConfirmSheet(item),
                      icon: const Icon(Icons.check_circle_outline_rounded),
                      label: Text(
                        'Confirm',
                        style: GoogleFonts.outfit(fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}
