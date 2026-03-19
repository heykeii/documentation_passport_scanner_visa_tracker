import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;

import 'core/config/app_config.dart';

class TWSearch {
  static const sky = Color(0xFFBBE0EF);
  static const navy = Color(0xFF161E54);
  static const navyLt = Color(0xFF1E2A6E);
  static const orange = Color(0xFFF16D34);
  static const peach = Color(0xFFFF986A);
  static const bg = Color(0xFFF0F6FA);
  static const white = Colors.white;
}

class SearchPage extends StatefulWidget {
  final String authToken;
  final String userEmail;

  const SearchPage({
    super.key,
    required this.authToken,
    required this.userEmail,
  });

  @override
  State<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends State<SearchPage> {
  final TextEditingController _searchCtrl = TextEditingController();

  bool _isLoading = true;
  String? _error;
  DateTime _selectedDate = DateTime(DateTime.now().year, DateTime.now().month);
  List<Map<String, dynamic>> _records = [];

  @override
  void initState() {
    super.initState();
    _searchCtrl.addListener(() => setState(() {}));
    _loadRecords();
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

    var list = _records.where((r) {
      final dateStr = (r['createdAt'] ?? r['updatedAt'] ?? '').toString();
      final date = DateTime.tryParse(dateStr);
      if (date == null) return false;
      return date.year == _selectedDate.year &&
          date.month == _selectedDate.month;
    }).toList();

    if (q.isNotEmpty) {
      list = list.where((r) {
        final name = _fullName(r).toLowerCase();
        final passportNumber = (r['passportNumber'] ?? '')
            .toString()
            .toLowerCase();
        final portalRef = (r['portalRefNo'] ?? '').toString().toLowerCase();
        final agency = (r['agency'] ?? '').toString().toLowerCase();
        final embassy = (r['embassy'] ?? '').toString().toLowerCase();
        return name.contains(q) ||
            passportNumber.contains(q) ||
            portalRef.contains(q) ||
            agency.contains(q) ||
            embassy.contains(q);
      }).toList();
    }

    list.sort((a, b) {
      final ad =
          DateTime.tryParse((a['updatedAt'] ?? '').toString()) ??
          DateTime.tryParse((a['createdAt'] ?? '').toString()) ??
          DateTime.fromMillisecondsSinceEpoch(0);
      final bd =
          DateTime.tryParse((b['updatedAt'] ?? '').toString()) ??
          DateTime.tryParse((b['createdAt'] ?? '').toString()) ??
          DateTime.fromMillisecondsSinceEpoch(0);
      return bd.compareTo(ad);
    });

    return list;
  }

  Future<void> _loadRecords() async {
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
        throw Exception(body['error'] ?? 'Failed to load records');
      }

      final rows = (body['data'] as List?)?.cast<Map<String, dynamic>>() ?? [];

      // Filter to only mobile-scanned records for this officer
      final filtered = rows
          .where((r) => (r['source'] ?? '').toString() == 'mobile')
          .where(
            (r) => (r['officerEmail'] ?? '').toString() == widget.userEmail,
          )
          .toList();

      if (!mounted) return;
      setState(() {
        _records = filtered;
        _isLoading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'Unable to load records.';
        _isLoading = false;
      });
    }
  }

  String _fullName(Map<String, dynamic> item) {
    final first = (item['firstName'] ?? '').toString().trim();
    final middle = (item['middleName'] ?? '').toString().trim();
    final last = (item['surname'] ?? '').toString().trim();
    final full = [first, middle, last].where((e) => e.isNotEmpty).join(' ');
    return full.isEmpty ? 'Unnamed Passenger' : full;
  }

  String _meta(Map<String, dynamic> item) {
    final passport = (item['passportNumber'] ?? '').toString().trim();
    final portal = (item['portalRefNo'] ?? '').toString().trim();

    final left = passport.isEmpty ? 'No passport number' : 'Passport $passport';
    final right = portal.isEmpty ? 'No portal ref' : 'Ref $portal';
    return '$left • $right';
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filtered;

    return Scaffold(
      backgroundColor: TWSearch.bg,
      body: SafeArea(
        child: Column(
          children: [
            _header(filtered.length),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
              child: _searchBar(),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
              child: _filters(),
            ),
            Expanded(
              child: RefreshIndicator(
                onRefresh: _loadRecords,
                child: _content(filtered),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _header(int visibleCount) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 10, 16, 12),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [TWSearch.navyLt, TWSearch.navy],
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
                  'My Scans',
                  style: GoogleFonts.outfit(
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                Text(
                  '$visibleCount results • ${_records.length} total',
                  style: GoogleFonts.outfit(fontSize: 12, color: TWSearch.sky),
                ),
              ],
            ),
          ),
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [TWSearch.orange, TWSearch.peach],
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.manage_search_rounded, color: Colors.white),
          ),
        ],
      ),
    );
  }

  Widget _searchBar() {
    return TextField(
      controller: _searchCtrl,
      decoration: InputDecoration(
        hintText: 'Search name, passport no, portal ref, agency, embassy',
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
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: TWSearch.sky.withOpacity(0.45)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: TWSearch.navy, width: 1.2),
        ),
      ),
      style: GoogleFonts.outfit(color: TWSearch.navy),
    );
  }

  Widget _filters() {
    return Row(
      children: [
        Expanded(child: _monthDropdown()),
        const SizedBox(width: 8),
        Expanded(child: _yearDropdown()),
      ],
    );
  }

  Widget _monthDropdown() {
    final months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: TWSearch.navy.withOpacity(0.2)),
      ),
      child: DropdownButton<int>(
        value: _selectedDate.month,
        isExpanded: true,
        underline: const SizedBox(),
        onChanged: (month) {
          if (month != null) {
            setState(() {
              _selectedDate = DateTime(_selectedDate.year, month);
            });
          }
        },
        items: List.generate(
          12,
          (i) => DropdownMenuItem(
            value: i + 1,
            child: Text(months[i], style: GoogleFonts.outfit()),
          ),
        ),
      ),
    );
  }

  Widget _yearDropdown() {
    final currentYear = DateTime.now().year;
    final years = List.generate(5, (i) => currentYear - i);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: TWSearch.navy.withOpacity(0.2)),
      ),
      child: DropdownButton<int>(
        value: _selectedDate.year,
        isExpanded: true,
        underline: const SizedBox(),
        onChanged: (year) {
          if (year != null) {
            setState(() {
              _selectedDate = DateTime(year, _selectedDate.month);
            });
          }
        },
        items: years.map((year) {
          return DropdownMenuItem(
            value: year,
            child: Text(year.toString(), style: GoogleFonts.outfit()),
          );
        }).toList(),
      ),
    );
  }

  Widget _content(List<Map<String, dynamic>> filtered) {
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
                    color: TWSearch.orange,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                OutlinedButton(
                  onPressed: _loadRecords,
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ],
      );
    }

    if (filtered.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          const SizedBox(height: 120),
          Icon(
            Icons.search_off_rounded,
            size: 54,
            color: TWSearch.navy.withOpacity(0.35),
          ),
          const SizedBox(height: 10),
          Center(
            child: Text(
              'No matching records.',
              style: GoogleFonts.outfit(
                color: TWSearch.navy,
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const SizedBox(height: 6),
          Center(
            child: Text(
              'Try a different keyword or payment filter.',
              style: GoogleFonts.outfit(
                color: TWSearch.navy.withOpacity(0.55),
                fontSize: 13,
              ),
            ),
          ),
        ],
      );
    }

    return ListView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 18),
      itemCount: filtered.length,
      itemBuilder: (context, index) {
        final item = filtered[index];

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: TWSearch.navy.withOpacity(0.06),
                blurRadius: 16,
                offset: const Offset(0, 5),
              ),
            ],
          ),
          child: ExpansionTile(
            tilePadding: const EdgeInsets.symmetric(
              horizontal: 14,
              vertical: 4,
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            collapsedShape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            title: Text(
              _fullName(item),
              style: GoogleFonts.outfit(
                fontSize: 17,
                fontWeight: FontWeight.w700,
                color: TWSearch.navy,
              ),
            ),
            subtitle: Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                _meta(item),
                style: GoogleFonts.outfit(
                  fontSize: 12,
                  color: TWSearch.navy.withOpacity(0.55),
                ),
              ),
            ),
            trailing: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: TWSearch.orange.withOpacity(0.12),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                'Scanned',
                style: GoogleFonts.outfit(
                  color: TWSearch.orange,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            childrenPadding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
            children: [
              _detailRow('Agency', (item['agency'] ?? '').toString()),
              _detailRow('Embassy', (item['embassy'] ?? '').toString()),
              _detailRow('Tour Name', (item['tourName'] ?? '').toString()),
              _detailRow(
                'Appointment',
                (item['appointmentDate'] ?? '').toString(),
              ),
              _detailRow('Departure', (item['departureDate'] ?? '').toString()),
              _detailRow(
                'Updated',
                (item['updatedAt'] ?? item['createdAt'] ?? '').toString(),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(
              label,
              style: GoogleFonts.outfit(
                fontSize: 12,
                color: TWSearch.navy.withOpacity(0.5),
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value.trim().isEmpty ? '-' : value,
              style: GoogleFonts.outfit(
                fontSize: 13,
                color: TWSearch.navy,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
