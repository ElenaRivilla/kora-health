import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../application/water_tracking_providers.dart';
import 'water_quick_log_widget.dart';

class WaterHistoryScreen extends ConsumerWidget {
  const WaterHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final historyAsync = ref.watch(waterHistoryProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Historial de agua')),
      body: Column(
        children: [
          const Padding(
            padding: EdgeInsets.all(16),
            child: WaterQuickLogWidget(),
          ),
          Expanded(
            child: historyAsync.when(
              data: (days) => ListView.builder(
                itemCount: days.length,
                itemBuilder: (context, index) {
                  final day = days[index];
                  return ListTile(
                    title: Text('${day.date.toLocal()}'.split(' ').first),
                    subtitle: Text(
                      day.goalMl != null
                          ? '${day.totalMl} ml / objetivo ${day.goalMl} ml'
                          : '${day.totalMl} ml',
                    ),
                  );
                },
              ),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, _) => Center(child: Text('Error: $err')),
            ),
          ),
        ],
      ),
    );
  }
}
