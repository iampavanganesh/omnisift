import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/errors/failure.dart';
import '../../domain/entities/affiliate_click.dart';
import 'affiliate_providers.dart';

enum ClickHistoryStatus { loading, success, empty, error }

class ClickHistoryState {
  const ClickHistoryState({
    this.status = ClickHistoryStatus.loading,
    this.items = const [],
    this.page = 0,
    this.hasMore = true,
    this.isLoadingMore = false,
    this.failure,
  });
  final ClickHistoryStatus status;
  final List<AffiliateClick> items;
  final int page;
  final bool hasMore;
  final bool isLoadingMore;
  final Failure? failure;

  ClickHistoryState copyWith({
    ClickHistoryStatus? status,
    List<AffiliateClick>? items,
    int? page,
    bool? hasMore,
    bool? isLoadingMore,
    Failure? failure,
  }) =>
      ClickHistoryState(
        status: status ?? this.status,
        items: items ?? this.items,
        page: page ?? this.page,
        hasMore: hasMore ?? this.hasMore,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: failure,
      );
}

final clickHistoryControllerProvider =
    NotifierProvider<ClickHistoryController, ClickHistoryState>(ClickHistoryController.new);

class ClickHistoryController extends Notifier<ClickHistoryState> {
  @override
  ClickHistoryState build() {
    Future.microtask(load);
    return const ClickHistoryState();
  }

  Future<void> load() async {
    state = state.copyWith(status: ClickHistoryStatus.loading);
    try {
      final page = await ref.read(affiliateApiProvider).history(page: 0);
      state = state.copyWith(
        status: page.items.isEmpty ? ClickHistoryStatus.empty : ClickHistoryStatus.success,
        items: page.items
            .map((d) => AffiliateClick(
                  id: d.id,
                  productId: d.productId,
                  productTitle: d.productTitle,
                  productImageUrl: d.productImageUrl,
                  sellerName: d.sellerName,
                  targetUrl: d.targetUrl,
                  clickedAt: DateTime.tryParse(d.clickedAt) ?? DateTime.now(),
                ))
            .toList(),
        page: 0,
        hasMore: page.hasMore,
      );
    } on Failure catch (f) {
      state = state.copyWith(status: ClickHistoryStatus.error, failure: f);
    }
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore || state.status != ClickHistoryStatus.success) return;
    final nextPage = state.page + 1;
    state = state.copyWith(isLoadingMore: true);
    try {
      final page = await ref.read(affiliateApiProvider).history(page: nextPage);
      state = state.copyWith(
        items: [
          ...state.items,
          ...page.items.map((d) => AffiliateClick(
                id: d.id,
                productId: d.productId,
                productTitle: d.productTitle,
                productImageUrl: d.productImageUrl,
                sellerName: d.sellerName,
                targetUrl: d.targetUrl,
                clickedAt: DateTime.tryParse(d.clickedAt) ?? DateTime.now(),
              )),
        ],
        page: nextPage,
        hasMore: page.hasMore,
        isLoadingMore: false,
      );
    } on Failure catch (_) {
      state = state.copyWith(isLoadingMore: false, hasMore: false);
    }
  }
}
