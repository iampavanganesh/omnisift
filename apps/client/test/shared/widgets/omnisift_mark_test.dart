import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:omnisift/shared/widgets/omnisift_mark.dart';

void main() {
  testWidgets('OmnisiftMark renders the bundled SVG for both light and dark',
      (tester) async {
    for (final onDark in [false, true]) {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: OmnisiftMark(onDark: onDark)),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byType(SvgPicture), findsOneWidget);
      expect(tester.takeException(), isNull);
    }
  });
}
