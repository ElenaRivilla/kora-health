import 'package:drift/drift.dart';
import 'package:drift/native.dart';

part 'app_database.g.dart';

// No tables yet — module tables (water-tracking, etc.) are added by the
// `sync` change, which introduces the local offline cache.
@DriftDatabase(tables: [])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(NativeDatabase.memory());

  @override
  int get schemaVersion => 1;
}
