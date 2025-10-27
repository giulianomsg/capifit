import 'package:flutter/material.dart';

class NutritionScreen extends StatelessWidget {
  const NutritionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final meals = [
      {
        'time': '07:30',
        'title': 'Café da manhã',
        'items': 'Ovos mexidos, aveia com frutas, café preto',
        'calories': 420,
      },
      {
        'time': '12:30',
        'title': 'Almoço',
        'items': 'Peito de frango, arroz integral, salada verde, azeite',
        'calories': 560,
      },
      {
        'time': '16:30',
        'title': 'Pré-treino',
        'items': 'Iogurte grego, banana, pasta de amendoim',
        'calories': 280,
      },
    ];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text('Resumo nutricional', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                SizedBox(height: 12),
                Text('Meta diária: 2.100 kcal · Proteína 150g · Carboidratos 230g · Gorduras 70g'),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        ...meals.map(
          (meal) => Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            margin: const EdgeInsets.only(bottom: 12),
            child: ListTile(
              leading: CircleAvatar(child: Text(meal['time'] as String)),
              title: Text(meal['title'] as String, style: const TextStyle(fontWeight: FontWeight.w600)),
              subtitle: Text(meal['items'] as String),
              trailing: Text('${meal['calories']} kcal'),
            ),
          ),
        ),
      ],
    );
  }
}
