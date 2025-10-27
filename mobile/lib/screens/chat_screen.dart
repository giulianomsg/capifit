import 'package:flutter/material.dart';

class ChatScreen extends StatelessWidget {
  const ChatScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final messages = [
      {'from': 'Ana Souza', 'content': 'Treino incrível hoje! Pode aumentar a carga na próxima semana?', 'time': '08:45'},
      {'from': 'Você', 'content': 'Claro, Ana! Vou ajustar as séries e monitorar a recuperação.', 'time': '08:47'},
      {'from': 'João Lima', 'content': 'Enviei os exames novos no app.', 'time': '11:05'},
    ];

    return Column(
      children: [
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            reverse: true,
            itemCount: messages.length,
            itemBuilder: (context, index) {
              final message = messages[messages.length - index - 1];
              final isSelf = message['from'] == 'Você';
              return Align(
                alignment: isSelf ? Alignment.centerRight : Alignment.centerLeft,
                child: Container(
                  margin: const EdgeInsets.symmetric(vertical: 6),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isSelf ? Theme.of(context).colorScheme.primaryContainer : Theme.of(context).cardColor,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (!isSelf)
                        Text(
                          message['from'] as String,
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                      Text(message['content'] as String),
                      Align(
                        alignment: Alignment.bottomRight,
                        child: Text(
                          message['time'] as String,
                          style: Theme.of(context).textTheme.labelSmall,
                        ),
                      )
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        SafeArea(
          minimum: const EdgeInsets.all(16),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  decoration: InputDecoration(
                    hintText: 'Enviar mensagem...',
                    filled: true,
                    fillColor: Theme.of(context).cardColor,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(30),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              FloatingActionButton.small(
                onPressed: () {},
                child: const Icon(Icons.send_rounded),
              )
            ],
          ),
        )
      ],
    );
  }
}
