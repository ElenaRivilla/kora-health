import 'package:dio/dio.dart';

import '../../../core/api_client.dart';
import 'water_tracking_models.dart';

class WaterTrackingRepository {
  final ApiClient _apiClient;

  WaterTrackingRepository(this._apiClient);

  Future<WaterGoal?> getGoal() async {
    try {
      final response = await _apiClient.dio.get('/api/water-tracking/goal');
      return WaterGoal.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) return null;
      rethrow;
    }
  }

  Future<WaterGoal> setGoal(int dailyGoalMl) async {
    final response = await _apiClient.dio.put(
      '/api/water-tracking/goal',
      data: {'dailyGoalMl': dailyGoalMl},
    );
    return WaterGoal.fromJson(response.data as Map<String, dynamic>);
  }

  Future<WaterEntry> logEntry(int amountMl) async {
    final response = await _apiClient.dio.post(
      '/api/water-tracking/entries',
      data: {'amountMl': amountMl},
    );
    return WaterEntry.fromJson(response.data as Map<String, dynamic>);
  }

  Future<List<WaterHistoryDay>> getHistory({int days = 30}) async {
    final response = await _apiClient.dio.get(
      '/api/water-tracking/history',
      queryParameters: {'days': days},
    );
    return (response.data as List)
        .map((e) => WaterHistoryDay.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
