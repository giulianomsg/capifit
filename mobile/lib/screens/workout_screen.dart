import 'package:flutter/material.dart';

class WorkoutScreen extends StatelessWidget {
  const WorkoutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final workouts = [
      {
        'title': 'Full Body Power',
        'days': 'Seg • Qua • Sex',
        'exercises': 8,
        'progress': 0.82,
      },
      {
        'title': 'Smart Burn HIIT',
        'days': 'Ter • Qui',
        'exercises': 10,
        'progress': 0.64,
      },
    ];

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: workouts.length,
      itemBuilder: (context, index) {
        final workout = workouts[index];
        return Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          margin: const EdgeInsets.only(bottom: 16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        workout['title'] as String,
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.play_circle_outline),
                      onPressed: () {},
                    )
                  ],
                ),
                Text(workout['days'] as String, style: Theme.of(context).textTheme.labelMedium),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Exercícios: ${(workout['exercises'] as int).toString()}'),
                    Text('Evolução ${(workout['progress'] as double * 100).round()}%'),
                  ],
                ),
                const SizedBox(height: 8),
                LinearProgressIndicator(
                  value: workout['progress'] as double,
                  minHeight: 8,
                  borderRadius: BorderRadius.circular(8),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
