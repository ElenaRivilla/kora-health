import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../providers/api_client_provider.dart';
import '../data/water_tracking_models.dart';
import '../data/water_tracking_repository.dart';

final waterTrackingRepositoryProvider = Provider<WaterTrackingRepository>(
  (ref) => WaterTrackingRepository(ref.watch(apiClientProvider)),
);

final waterGoalProvider = FutureProvider.autoDispose<WaterGoal?>(
  (ref) => ref.watch(waterTrackingRepositoryProvider).getGoal(),
);

final waterHistoryProvider = FutureProvider.autoDispose<List<WaterHistoryDay>>(
  (ref) => ref.watch(waterTrackingRepositoryProvider).getHistory(),
);

class WaterGoalController extends AsyncNotifier<void> {
  @override
  Future<void> build() async {}

  Future<void> setGoal(int dailyGoalMl) async {
    await ref.read(waterTrackingRepositoryProvider).setGoal(dailyGoalMl);
    ref.invalidate(waterGoalProvider);
  }
}

final waterGoalControllerProvider =
    AsyncNotifierProvider<WaterGoalController, void>(WaterGoalController.new);

class WaterEntryController extends AsyncNotifier<void> {
  @override
  Future<void> build() async {}

  Future<void> logEntry(int amountMl) async {
    await ref.read(waterTrackingRepositoryProvider).logEntry(amountMl);
    ref.invalidate(waterHistoryProvider);
  }
}

final waterEntryControllerProvider =
    AsyncNotifierProvider<WaterEntryController, void>(WaterEntryController.new);
