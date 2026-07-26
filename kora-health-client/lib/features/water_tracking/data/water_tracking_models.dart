class WaterGoal {
  final int dailyGoalMl;
  final DateTime dateUpdated;

  WaterGoal({required this.dailyGoalMl, required this.dateUpdated});

  factory WaterGoal.fromJson(Map<String, dynamic> json) => WaterGoal(
        dailyGoalMl: json['dailyGoalMl'] as int,
        dateUpdated: DateTime.parse(json['dateUpdated'] as String),
      );
}

class WaterEntry {
  final int id;
  final int amountMl;
  final DateTime dateCreated;

  WaterEntry({required this.id, required this.amountMl, required this.dateCreated});

  factory WaterEntry.fromJson(Map<String, dynamic> json) => WaterEntry(
        id: json['id'] as int,
        amountMl: json['amountMl'] as int,
        dateCreated: DateTime.parse(json['dateCreated'] as String),
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
