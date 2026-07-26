import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../application/water_tracking_providers.dart';

/// Quick-log action: minimal interactions to record a water intake entry,
/// per the "Quick Water Logging" requirement.
class WaterQuickLogWidget extends ConsumerWidget {
  const WaterQuickLogWidget({super.key});

  static const _quickAmounts = [100, 250, 500];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: _quickAmounts
          .map(
            (amount) => ElevatedButton(
              onPressed: () => ref
                  .read(waterEntryControllerProvider.notifier)
                  .logEntry(amount),
              child: Text('+$amount ml'),
            ),
          )
          .toList(),
    );
  }
}
