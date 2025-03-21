import BackHeader from "@/src/components/layout/BackHeader";
import styles from "./PackageDetail.module.css";
import DefaultButton from "@/src/components/ui/DefaultButton";
import PackageItem from "@/src/components/ui/PackageItem";
import AddIconImage from "@/src/assets/images/page/package-detail/add_icon.png";
import EditIconImage from "@/src/assets/images/page/package-detail/edit_icon.png";
import ArrowRightIconImage from "@/src/assets/images/page/package-detail/arrow_right.png";
import DeleteIconImage from "@/src/assets/images/page/package-detail/delete.png";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LoadingSection from "@/src/components/layout/LoadingSection";
import CompleteSection from "@/src/components/layout/CompleteSection";
import PackageModel from "@/src/models/PackageModel";
import CategoryModel from "@/src/models/CategoryModel";
import { useRecoilState } from "recoil";
import { editingPackageState } from "@/src/recoil/packageState";
import BuyerProductModel from "@/src/models/BuyerProductModel";
import { useCategory } from "@/src/hooks/useCategory";
import { useBuyerProduct } from "@/src/hooks/useBuyerProduct";
import industryData from "@/src/data/industryData.json";
import { useOrder } from "@/src/hooks/useOrder";
import OrderModel from "@/src/models/OrderModel";
import { useUser } from "@/src/contexts/UserContext";
import { usePackage } from "@/src/hooks/usePackage";
import { getCurrentTimeISO } from "@/src/utils/dateUtil";

export default function PackageDetail() {
    // page connection
    const navigate = useNavigate();
    const location = useLocation();
    const myPackage: PackageModel = PackageModel.fromJson(location.state?.pkg || {});
    // context
    const { user } = useUser();
    // hook
    const { createPackage } = usePackage();
    const { categories } = useCategory();
    const { buyerProducts } = useBuyerProduct();
    const { createOrder } = useOrder();
    // recoil
    const [editingPackage, setEditingPackage] = useRecoilState(editingPackageState);
    // useState
    const [myCategories, setMyCategories] = useState<CategoryModel[]>([]);
    const [myProducts, setMyProducts] = useState<BuyerProductModel[]>([])
    const [isComplete, setIsComplete] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // UseEffect
    useEffect(() => {
        let targetPackage = null;
        if (!editingPackage) {
            targetPackage = myPackage;
            setEditingPackage(myPackage);
        } else {
            targetPackage = editingPackage
        }
        const newMyCategories: CategoryModel[] = targetPackage.categories
            .map((categoryId) => categories.find((category) => category.id === categoryId))
            .filter(Boolean) as CategoryModel[];
        setMyCategories(newMyCategories);
        const newMyProducts: BuyerProductModel[] = targetPackage.products
            .map((productId) => buyerProducts.find((buyerProduct) => buyerProduct.id === productId))
            .filter(Boolean) as BuyerProductModel[];
        setMyProducts(newMyProducts);
    }, [])

    // Function
    const handleAddCategoryButtonClick = () => {
        navigate('/package-detail-add-category', { state: { industry: (industryData.find((industry) => industry.id === myPackage.industry)) } })
    }
    const handleEditButtonClick = () => {
        setIsEdit(!isEdit);
    }
    const handleBuyButtonClick = () => {
        setIsModalOpen(!isModalOpen);
    };
    const handleBuyConfirmButtonClick = async () => {
        setIsLoading(true);
        if (!editingPackage) {
            setIsLoading(false);
            return;
        }
        const newPackage: PackageModel | null = await createPackage(editingPackage);
        if (newPackage) {
            await createOrder(OrderModel
                .fromJson({ userId: user?.userId, packageId: newPackage.id, createdAt: getCurrentTimeISO() }));
            setIsComplete(true);
        } else {
            setIsLoading(false);
            window.alert('주문에 오류가 발생하였습니다. 다시 시도해주세요.');
        }
    };
    const handleAddProductButtonClick = (category: CategoryModel) => {
        navigate('/package-detail-add-product', { state: { category: category.toJson() } });
    }
    const handleDeleteButtonClick = (categoryId: number) => {
        setMyCategories((prev) => prev.filter((category) => category.id !== categoryId));
        setMyProducts((prev) => prev.filter((product) => product.category !== categoryId));
        setEditingPackage((prev) => {
            if (!prev) return prev;
            return PackageModel.fromJson({
                ...prev.toJson(),
                "categories": prev.categories.filter((id) => id !== categoryId),
                "products": prev.products.filter((id) => myProducts.some((product) => product.id === id))
            });
        });
    }

    // return
    return (
        isLoading ? (isComplete ? <CompleteSection text="패키지 구매 신청 완료!" /> : <LoadingSection text="잠시만 기다려주세요" />) : <div className={styles.page}>
            <BackHeader />
            <div className={styles.section}>
                <div className={styles.packageCard}>
                    {editingPackage && <PackageItem pkg={editingPackage} />}
                </div>
                <div className={styles.titleContainer}>
                    <p className={styles.listViewTitle}>
                        구성상품
                    </p>
                    <div className={styles.blank} />
                    <div className={styles.iconButtonContainer}>
                        <button className={styles.iconButton} onClick={handleAddCategoryButtonClick}>
                            <img className={styles.iconButtonImage} src={AddIconImage} />
                        </button>
                        <button className={styles.iconButton} onClick={handleEditButtonClick} style={{ backgroundColor: `${!isEdit ? '#00A36C' : '#7F7F89'}` }}>
                            <img className={styles.iconButtonImage} src={EditIconImage} />
                        </button>
                    </div>
                </div>
                <div className={styles.listView}>
                    {myCategories.map((category, index) => {
                        const myProduct = myProducts.find((product) => product.category === category.id) || null;
                        return (
                            <div key={index} className={styles.productItem} onClick={() => { handleAddProductButtonClick(category) }}>
                                <img className={styles.productThumbnail} src={myProduct?.images[0] || "https://www.urbanbrush.net/web/wp-content/uploads/edd/2023/03/urban-20230310112234917676-1024x1024.jpg"} />
                                <div className={styles.productInfoContainer}>
                                    <p className={styles.productName}>
                                        {myProduct?.name}
                                    </p>
                                    <p className={styles.categoryAndAmount}>
                                        {myProduct ? `${category.name} ${myProduct?.quantity}개` : '제품을 골라주세요!'}
                                    </p>
                                </div>
                                <div className={styles.blank} />
                                <p className={styles.price}>
                                    {myProduct && `${myProduct?.price}원`}
                                </p>
                                {
                                    isEdit ? (<button className={styles.deleteProductButton} onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteButtonClick(category.id!);
                                    }}>
                                        <img className={styles.deleteProductButtonIcon} src={DeleteIconImage} />
                                    </button>) : (<button className={styles.searchOtherProductsButton}>
                                        <img className={styles.searchOtherProductsButtonIcon} src={ArrowRightIconImage} />
                                    </button>)
                                }
                            </div>
                        )
                    })}
                </div>
                <div style={{'height': '20rem'}}/>
            </div>
            <DefaultButton event={handleBuyButtonClick} isActive={true} text="한번에 구매하기"/>

            {/* Modal */}
            {isModalOpen && (
                <div className={styles.overlay} onClick={() => setIsModalOpen(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <p className={styles.modalTitle}>
                            선택한 물품들을 한번에<br />구매하시겠어요?
                        </p>
                        <p className={styles.description}>
                            결제와 배송은 카카오톡으로 진행됩니다.
                        </p>
                        <button className={styles.buttonInModal} onClick={handleBuyConfirmButtonClick}>
                            <p>한번에 구매할게요</p>
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}