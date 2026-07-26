import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../application/water_tracking_providers.dart';
import 'water_quick_log_widget.dart';

class WaterHistorySection extends ConsumerWidget {
  const WaterHistorySection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final historyAsync = ref.watch(waterHistoryProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const WaterQuickLogWidget(),
        const SizedBox(height: 16),
        historyAsync.when(
          data: (days) => ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: days.length,
            itemBuilder: (context, index) {
              final day = days[index];
              return ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text('${day.date.toLocal()}'.split(' ').first),
                subtitle: Text(
                  day.goalMl != null
                      ? '${day.totalMl} ml / ${day.goalMl} ml'
                      : '${day.totalMl} ml',
                ),
              );
            },
          ),
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, _) => Text('Error: $err'),
        ),
      ],
    );
  }
}
