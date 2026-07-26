class WaterGoal {
  final int dailyGoalMl;
  final DateTime updatedAt;

  WaterGoal({required this.dailyGoalMl, required this.updatedAt});

  factory WaterGoal.fromJson(Map<String, dynamic> json) => WaterGoal(
        dailyGoalMl: json['dailyGoalMl'] as int,
        updatedAt: DateTime.parse(json['updatedAt'] as String),
      );
}

class WaterEntry {
  final int id;
  final int amountMl;
  final DateTime loggedAtUtc;

  WaterEntry({required this.id, required this.amountMl, required this.loggedAtUtc});

  factory WaterEntry.fromJson(Map<String, dynamic> json) => WaterEntry(
        id: json['id'] as int,
        amountMl: json['amountMl'] as int,
        loggedAtUtc: DateTime.parse(json['loggedAtUtc'] as String),
      );
}

class WaterHistoryDay {
  final DateTime date;
  final int totalMl;
  final int? goalMl;

  WaterHistoryDay({required this.date, required this.totalMl, this.goalMl});

  factory WaterHistoryDay.fromJson(Map<String, dynamic> json) => WaterHistoryDay(
        date: DateTime.parse(json['date'] as String),
        totalMl: json['totalMl'] as int,
        goalMl: json['goalMl'] as int?,
      );
}
