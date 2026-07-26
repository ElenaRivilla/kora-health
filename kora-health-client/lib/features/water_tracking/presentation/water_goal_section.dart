import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../application/water_tracking_providers.dart';

class WaterGoalSection extends ConsumerWidget {
  const WaterGoalSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final goalAsync = ref.watch(waterGoalProvider);
    final controller = TextEditingController();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        goalAsync.when(
          data: (goal) => Text(
            goal == null
                ? 'Sin objetivo configurado todavía'
                : 'Objetivo actual: ${goal.dailyGoalMl} ml',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          loading: () => const CircularProgressIndicator(),
          error: (err, _) => Text('Error: $err'),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: 'Nuevo objetivo (ml)'),
        ),
        const SizedBox(height: 16),
        ElevatedButton(
          onPressed: () async {
            final value = int.tryParse(controller.text);
            if (value == null || value <= 0) return;
            await ref.read(waterGoalControllerProvider.notifier).setGoal(value);
          },
          child: const Text('Guardar objetivo'),
        ),
      ],
    );
  }
}
